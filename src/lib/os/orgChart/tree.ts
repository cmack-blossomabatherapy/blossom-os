/**
 * Pure org-chart tree builder + tidy layout.
 *
 * Hierarchy resolution order for each person:
 *   1. Saved manual override parent (`org_chart_layout.parent_override`)
 *   2. Live `employees.manager_id` (synced from Viventium / HR)
 *   3. Inferred department leader (highest leadership rank in the department)
 *   4. Company root
 *
 * Cycles are broken by falling back to the company root, so the result is
 * always a real tree.
 */

export const ORG_ROOT_ID = "__blossom_root__";

export type OrgLeadershipLevel =
  | "executive"
  | "director"
  | "manager"
  | "lead"
  | "individual";

export interface OrgPersonInput {
  id: string;
  name: string;
  title?: string | null;
  departmentName?: string | null;
  leadershipLevel?: OrgLeadershipLevel | null;
  managerId?: string | null;
  email?: string | null;
  photo?: string | null;
  state?: string | null;
  status?: string | null;
}

export interface OrgLayoutOverride {
  employeeId: string;
  parentEmployeeId?: string | null;
  parentOverride?: boolean;
  positionX?: number | null;
  positionY?: number | null;
  collapsed?: boolean;
}

export type OrgParentSource = "override" | "manager" | "inferred" | "root";

export interface OrgTreeNode {
  id: string;
  parentId: string | null;
  parentSource: OrgParentSource;
  depth: number;
  childIds: string[];
  directReports: number;
  totalReports: number;
  person: OrgPersonInput | null;
  /** true for the synthetic company root */
  isRoot: boolean;
  position: { x: number; y: number };
  /** Position came from a saved drag, not auto-layout. */
  pinned: boolean;
  collapsed: boolean;
}

export interface OrgTree {
  nodes: Map<string, OrgTreeNode>;
  rootId: string;
  /** ids hidden because an ancestor is collapsed */
  hidden: Set<string>;
  orderedIds: string[];
}

const LEVEL_RANK: Record<OrgLeadershipLevel, number> = {
  executive: 0,
  director: 1,
  manager: 2,
  lead: 3,
  individual: 4,
};

export function leadershipRank(level: OrgLeadershipLevel | null | undefined): number {
  return LEVEL_RANK[(level ?? "individual") as OrgLeadershipLevel] ?? 4;
}

export const NODE_WIDTH = 236;
export const NODE_HEIGHT = 104;
export const H_GAP = 32;
export const V_GAP = 88;

function pickDepartmentLeaders(people: OrgPersonInput[]): Map<string, OrgPersonInput> {
  const byDept = new Map<string, OrgPersonInput>();
  for (const p of people) {
    const dept = (p.departmentName ?? "").trim();
    if (!dept) continue;
    const rank = leadershipRank(p.leadershipLevel);
    if (rank > 3) continue; // ICs never lead a department
    const current = byDept.get(dept);
    if (
      !current ||
      rank < leadershipRank(current.leadershipLevel) ||
      (rank === leadershipRank(current.leadershipLevel) &&
        p.name.localeCompare(current.name) < 0)
    ) {
      byDept.set(dept, p);
    }
  }
  return byDept;
}

/** Highest-ranking executive — inferred department leaders report to them. */
function pickTopExecutive(people: OrgPersonInput[]): OrgPersonInput | null {
  const execs = people
    .filter((p) => leadershipRank(p.leadershipLevel) === 0)
    .sort((a, b) => {
      const aCeo = /\b(ceo|chief executive|founder|owner)\b/i.test(a.title ?? "") ? 0 : 1;
      const bCeo = /\b(ceo|chief executive|founder|owner)\b/i.test(b.title ?? "") ? 0 : 1;
      if (aCeo !== bCeo) return aCeo - bCeo;
      return a.name.localeCompare(b.name);
    });
  return execs[0] ?? null;
}

export function buildOrgTree(
  people: OrgPersonInput[],
  overrides: OrgLayoutOverride[] = [],
): OrgTree {
  const valid = people.filter((p) => !!p.id && !!p.name);
  const byId = new Map(valid.map((p) => [p.id, p]));
  const overrideById = new Map(overrides.map((o) => [o.employeeId, o]));

  const deptLeaders = pickDepartmentLeaders(valid);
  const topExec = pickTopExecutive(valid);

  // ---- 1. Resolve raw parent per person -------------------------------
  const rawParent = new Map<string, { parentId: string | null; source: OrgParentSource }>();
  for (const p of valid) {
    const ov = overrideById.get(p.id);
    if (ov?.parentOverride) {
      const pid = ov.parentEmployeeId ?? null;
      if (pid === null) {
        rawParent.set(p.id, { parentId: null, source: "override" });
        continue;
      }
      if (pid !== p.id && byId.has(pid)) {
        rawParent.set(p.id, { parentId: pid, source: "override" });
        continue;
      }
    }
    if (p.managerId && p.managerId !== p.id && byId.has(p.managerId)) {
      rawParent.set(p.id, { parentId: p.managerId, source: "manager" });
      continue;
    }
    const leader = deptLeaders.get((p.departmentName ?? "").trim());
    if (leader && leader.id !== p.id) {
      rawParent.set(p.id, { parentId: leader.id, source: "inferred" });
      continue;
    }
    // Department leaders (and anyone else) fall to the top executive.
    if (topExec && topExec.id !== p.id && leadershipRank(p.leadershipLevel) > 0) {
      rawParent.set(p.id, { parentId: topExec.id, source: "inferred" });
      continue;
    }
    rawParent.set(p.id, { parentId: null, source: "root" });
  }

  // ---- 2. Break cycles ------------------------------------------------
  const resolved = new Map<string, { parentId: string | null; source: OrgParentSource }>();
  for (const p of valid) {
    const seen = new Set<string>([p.id]);
    let cursor = rawParent.get(p.id) ?? { parentId: null, source: "root" as OrgParentSource };
    let cycle = false;
    let walk = cursor.parentId;
    while (walk) {
      if (seen.has(walk)) {
        cycle = true;
        break;
      }
      seen.add(walk);
      walk = rawParent.get(walk)?.parentId ?? null;
    }
    if (cycle) cursor = { parentId: null, source: "root" };
    resolved.set(p.id, cursor);
  }

  // ---- 3. Nodes + children -------------------------------------------
  const nodes = new Map<string, OrgTreeNode>();
  nodes.set(ORG_ROOT_ID, {
    id: ORG_ROOT_ID,
    parentId: null,
    parentSource: "root",
    depth: 0,
    childIds: [],
    directReports: 0,
    totalReports: 0,
    person: null,
    isRoot: true,
    position: { x: 0, y: 0 },
    pinned: false,
    collapsed: false,
  });

  for (const p of valid) {
    const r = resolved.get(p.id)!;
    const ov = overrideById.get(p.id);
    nodes.set(p.id, {
      id: p.id,
      parentId: r.parentId ?? ORG_ROOT_ID,
      parentSource: r.parentId ? r.source : "root",
      depth: 0,
      childIds: [],
      directReports: 0,
      totalReports: 0,
      person: p,
      isRoot: false,
      position: {
        x: typeof ov?.positionX === "number" ? ov.positionX : 0,
        y: typeof ov?.positionY === "number" ? ov.positionY : 0,
      },
      pinned: typeof ov?.positionX === "number" && typeof ov?.positionY === "number",
      collapsed: !!ov?.collapsed,
    });
  }

  for (const node of nodes.values()) {
    if (node.id === ORG_ROOT_ID || !node.parentId) continue;
    nodes.get(node.parentId)?.childIds.push(node.id);
  }

  const sortChildren = (ids: string[]) =>
    ids.sort((a, b) => {
      const pa = nodes.get(a)!.person;
      const pb = nodes.get(b)!.person;
      const ra = leadershipRank(pa?.leadershipLevel);
      const rb = leadershipRank(pb?.leadershipLevel);
      if (ra !== rb) return ra - rb;
      return (pa?.name ?? "").localeCompare(pb?.name ?? "");
    });
  for (const node of nodes.values()) sortChildren(node.childIds);

  // ---- 4. Depth + report counts (iterative, tree is guaranteed acyclic)
  const orderedIds: string[] = [];
  const stack: Array<{ id: string; depth: number }> = [{ id: ORG_ROOT_ID, depth: 0 }];
  while (stack.length) {
    const { id, depth } = stack.pop()!;
    const node = nodes.get(id);
    if (!node) continue;
    node.depth = depth;
    orderedIds.push(id);
    for (const c of node.childIds) stack.push({ id: c, depth: depth + 1 });
  }

  // totalReports bottom-up
  const postorder = [...orderedIds].reverse();
  for (const id of postorder) {
    const node = nodes.get(id)!;
    node.directReports = node.childIds.length;
    node.totalReports = node.childIds.reduce(
      (sum, c) => sum + 1 + (nodes.get(c)?.totalReports ?? 0),
      0,
    );
  }

  // ---- 5. Collapse visibility ----------------------------------------
  const hidden = new Set<string>();
  const hideStack: string[] = [];
  for (const node of nodes.values()) if (node.collapsed) hideStack.push(...node.childIds);
  while (hideStack.length) {
    const id = hideStack.pop()!;
    if (hidden.has(id)) continue;
    hidden.add(id);
    hideStack.push(...(nodes.get(id)?.childIds ?? []));
  }

  layoutTree(nodes, ORG_ROOT_ID, hidden);

  return { nodes, rootId: ORG_ROOT_ID, hidden, orderedIds };
}

/**
 * Tidy top-down layout: visible leaves are packed left→right, parents are
 * centered above their visible children. Pinned (manually dragged) nodes keep
 * their saved position.
 */
export function layoutTree(
  nodes: Map<string, OrgTreeNode>,
  rootId: string,
  hidden: Set<string>,
): void {
  let cursor = 0;
  const place = (id: string): number => {
    const node = nodes.get(id);
    if (!node) return 0;
    const kids = node.childIds.filter((c) => !hidden.has(c));
    const autoY = node.depth * (NODE_HEIGHT + V_GAP);
    if (kids.length === 0 || node.collapsed) {
      const x = cursor;
      cursor += NODE_WIDTH + H_GAP;
      if (!node.pinned) node.position = { x, y: autoY };
      return x;
    }
    const childCenters = kids.map((c) => place(c));
    const center =
      (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
    if (!node.pinned) node.position = { x: center, y: autoY };
    return node.pinned ? node.position.x : center;
  };
  place(rootId);
}

/** All ancestor ids of a node, nearest first. */
export function ancestorsOf(tree: OrgTree, id: string): string[] {
  const out: string[] = [];
  let cursor = tree.nodes.get(id)?.parentId ?? null;
  const guard = new Set<string>([id]);
  while (cursor && !guard.has(cursor)) {
    out.push(cursor);
    guard.add(cursor);
    cursor = tree.nodes.get(cursor)?.parentId ?? null;
  }
  return out;
}

/** All descendant ids of a node. */
export function descendantsOf(tree: OrgTree, id: string): string[] {
  const out: string[] = [];
  const stack = [...(tree.nodes.get(id)?.childIds ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    out.push(cur);
    stack.push(...(tree.nodes.get(cur)?.childIds ?? []));
  }
  return out;
}

/**
 * Guard for re-parenting: a node can never be dropped onto itself or one of
 * its own descendants.
 */
export function canReparent(tree: OrgTree, childId: string, newParentId: string): boolean {
  if (childId === newParentId) return false;
  if (childId === tree.rootId) return false;
  if (!tree.nodes.has(childId) || !tree.nodes.has(newParentId)) return false;
  return !descendantsOf(tree, childId).includes(newParentId);
}

export interface OrgViventiumAuditRow {
  id: string;
  viventiumEmployeeId?: string | null;
  viventiumSyncStatus?: string | null;
  viventiumLastSync?: string | null;
  managerId?: string | null;
  jobTitle?: string | null;
  status?: string | null;
}

export interface OrgViventiumAudit {
  total: number;
  synced: number;
  notConnected: number;
  missingManager: number;
  missingTitle: number;
  lastSyncAt: string | null;
  coveragePct: number;
  managerCoveragePct: number;
}

/** Summarize how completely the org chart is backed by live Viventium data. */
export function auditViventiumCoverage(rows: OrgViventiumAuditRow[]): OrgViventiumAudit {
  const active = rows.filter(
    (r) => !r.status || r.status === "active" || r.status === "on_leave",
  );
  const total = active.length;
  let synced = 0;
  let missingManager = 0;
  let missingTitle = 0;
  let lastSyncAt: string | null = null;
  for (const r of active) {
    if (r.viventiumEmployeeId && r.viventiumSyncStatus === "synced") synced++;
    if (!r.managerId) missingManager++;
    if (!r.jobTitle || !r.jobTitle.trim()) missingTitle++;
    if (r.viventiumLastSync && (!lastSyncAt || r.viventiumLastSync > lastSyncAt)) {
      lastSyncAt = r.viventiumLastSync;
    }
  }
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
  return {
    total,
    synced,
    notConnected: total - synced,
    missingManager,
    missingTitle,
    lastSyncAt,
    coveragePct: pct(synced),
    managerCoveragePct: pct(total - missingManager),
  };
}