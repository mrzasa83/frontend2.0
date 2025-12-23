(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ManageBacklogPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next-auth/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/chart-column.js [app-client] (ecmascript) <export default as BarChart3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlayCircle$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/circle-play.js [app-client] (ecmascript) <export default as PlayCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$pause$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PauseCircle$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/circle-pause.js [app-client] (ecmascript) <export default as PauseCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpDown$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/arrow-up-down.js [app-client] (ecmascript) <export default as ArrowUpDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/arrow-up.js [app-client] (ecmascript) <export default as ArrowUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/arrow-down.js [app-client] (ecmascript) <export default as ArrowDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$BarChart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/recharts/es6/chart/BarChart.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Bar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/recharts/es6/cartesian/Bar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$XAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/recharts/es6/cartesian/XAxis.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$YAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/recharts/es6/cartesian/YAxis.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianGrid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/recharts/es6/cartesian/CartesianGrid.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/recharts/es6/component/Tooltip.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend2.4/node_modules/recharts/es6/component/ResponsiveContainer.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function ManageBacklogPage() {
    _s();
    const { data: session } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"])();
    const [currentJobs, setCurrentJobs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [refreshing, setRefreshing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [statusFilter, setStatusFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('all');
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [sortConfig, setSortConfig] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        key: 'name',
        direction: 'asc'
    });
    // Modal state
    const [selectedJob, setSelectedJob] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [modalOpen, setModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [editingJob, setEditingJob] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [savingJob, setSavingJob] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Job status notes (timeline)
    const [statusNotes, setStatusNotes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingNotes, setLoadingNotes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Section edits (HDW, PCB, ASM)
    const [hdwEdit, setHdwEdit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        text: '',
        hasHold: false,
        owner: '',
        target: '',
        action: '',
        onHoldDate: '',
        daysOnHold: 0,
        wasOnHold: false
    });
    const [pcbEdit, setPcbEdit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        text: '',
        hasHold: false,
        owner: '',
        target: '',
        action: '',
        onHoldDate: '',
        daysOnHold: 0,
        wasOnHold: false
    });
    const [asmEdit, setAsmEdit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        text: '',
        hasHold: false,
        owner: '',
        target: '',
        action: '',
        onHoldDate: '',
        daysOnHold: 0,
        wasOnHold: false
    });
    // Schedule edit (latest dates)
    const [scheduleEdit, setScheduleEdit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        hdw_date: '',
        hdw_complete: false,
        bom_date: '',
        bom_complete: false,
        cam_date: '',
        cam_complete: false,
        rev_date: '',
        rev_complete: false,
        prl_date: '',
        prl_complete: false,
        arl_date: '',
        arl_complete: false
    });
    // Engineer dropdown options
    const [camEngineers, setCamEngineers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [pcbEngineers, setPcbEngineers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [asmEngineers, setAsmEngineers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ManageBacklogPage.useEffect": ()=>{
            fetchCurrentJobs();
            fetchEngineers();
        }
    }["ManageBacklogPage.useEffect"], []);
    const fetchCurrentJobs = async ()=>{
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/dashboard/current-jobs');
            if (!res.ok) throw new Error('Failed to fetch current jobs');
            const data = await res.json();
            const jobsWithIds = (data.results || []).map((job, idx)=>({
                    ...job,
                    id: idx
                }));
            setCurrentJobs(jobsWithIds);
            await fetchJobStatuses(jobsWithIds);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally{
            setLoading(false);
        }
    };
    const fetchJobStatuses = async (jobs)=>{
        try {
            const shopPNs = jobs.map((j)=>j.shop_pn).filter((pn)=>pn && pn.trim() !== '');
            if (shopPNs.length === 0) return;
            const res_0 = await fetch('/api/admin/job-status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shopPNs
                })
            });
            if (!res_0.ok) return;
            const data_0 = await res_0.json();
            if (data_0.success && data_0.data) {
                setCurrentJobs((prev)=>prev.map((job_0)=>{
                        const statusData = data_0.data[job_0.shop_pn];
                        return statusData ? {
                            ...job_0,
                            release_status: statusData.releaseStatus,
                            program: statusData.program
                        } : job_0;
                    }));
            }
        } catch (err_0) {
            console.error('Error fetching job statuses:', err_0);
        }
    };
    const fetchEngineers = async ()=>{
        try {
            const res_1 = await fetch('/api/admin/engineer-roles');
            if (!res_1.ok) return;
            const data_1 = await res_1.json();
            const users = data_1.users || [];
            setCamEngineers(users.filter((u)=>u.roles.includes('CAM')));
            setPcbEngineers(users.filter((u_0)=>u_0.roles.includes('PCB')));
            setAsmEngineers(users.filter((u_1)=>u_1.roles.includes('ASM')));
        } catch (err_1) {
            console.error('Error fetching engineers:', err_1);
        }
    };
    const fetchJobNotes = async (jobName)=>{
        try {
            setLoadingNotes(true);
            const res_2 = await fetch(`/api/admin/job-notes?jobName=${encodeURIComponent(jobName)}`);
            if (!res_2.ok) throw new Error('Failed to fetch job notes');
            const data_2 = await res_2.json();
            const notes = data_2.notes || [];
            setStatusNotes(notes);
            // Initialize from latest note
            if (notes.length > 0) {
                const latest = notes[0];
                setHdwEdit({
                    text: latest.hdw_text || '',
                    hasHold: latest.hdw_hold?.hasHold || false,
                    owner: latest.hdw_hold?.owner || '',
                    target: latest.hdw_hold?.target || '',
                    action: latest.hdw_hold?.action || '',
                    onHoldDate: latest.hdw_hold?.onHoldDate || '',
                    daysOnHold: latest.hdw_hold?.daysOnHold || 0,
                    wasOnHold: latest.hdw_hold?.hasHold || false
                });
                setPcbEdit({
                    text: latest.pcb_text || '',
                    hasHold: latest.pcb_hold?.hasHold || false,
                    owner: latest.pcb_hold?.owner || '',
                    target: latest.pcb_hold?.target || '',
                    action: latest.pcb_hold?.action || '',
                    onHoldDate: latest.pcb_hold?.onHoldDate || '',
                    daysOnHold: latest.pcb_hold?.daysOnHold || 0,
                    wasOnHold: latest.pcb_hold?.hasHold || false
                });
                setAsmEdit({
                    text: latest.asm_text || '',
                    hasHold: latest.asm_hold?.hasHold || false,
                    owner: latest.asm_hold?.owner || '',
                    target: latest.asm_hold?.target || '',
                    action: latest.asm_hold?.action || '',
                    onHoldDate: latest.asm_hold?.onHoldDate || '',
                    daysOnHold: latest.asm_hold?.daysOnHold || 0,
                    wasOnHold: latest.asm_hold?.hasHold || false
                });
                setScheduleEdit({
                    hdw_date: latest.hdw_date || '',
                    hdw_complete: false,
                    // Will be parsed from notes if [HDW: complete]
                    bom_date: latest.bom_date || '',
                    bom_complete: false,
                    cam_date: latest.cam_date || '',
                    cam_complete: latest.cam_complete || false,
                    rev_date: latest.rev_date || '',
                    rev_complete: latest.rev_complete || false,
                    prl_date: latest.prl_date || '',
                    prl_complete: false,
                    arl_date: latest.arl_date || '',
                    arl_complete: false
                });
            }
        } catch (err_2) {
            console.error('Error fetching job notes:', err_2);
            setStatusNotes([]);
        } finally{
            setLoadingNotes(false);
        }
    };
    const handleRefresh = async ()=>{
        setRefreshing(true);
        await fetchCurrentJobs();
        setRefreshing(false);
    };
    // Calculate business days between two dates
    const getBusinessDaysDiff = (date1, date2)=>{
        if (!date1 || !date2) return null;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        let count = 0;
        const current = new Date(d1);
        while(current <= d2){
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
            current.setDate(current.getDate() + 1);
        }
        return d2 < d1 ? -count : count;
    };
    // Determine schedule status color
    const getScheduleStatus = (baseline, latest_0, isOnHold)=>{
        if (isOnHold) return 'red';
        if (!baseline || !latest_0) return 'neutral';
        // Check key dates against baseline
        const dates = [
            {
                base: baseline.hdw_date,
                current: latest_0.hdw_date
            },
            {
                base: baseline.bom_date,
                current: latest_0.bom_date
            },
            {
                base: baseline.prl_date,
                current: latest_0.prl_date
            },
            {
                base: baseline.arl_date,
                current: latest_0.arl_date
            }
        ];
        let maxDelay = 0;
        for (const d of dates){
            const diff = getBusinessDaysDiff(d.base, d.current);
            if (diff !== null && diff > maxDelay) maxDelay = diff;
        }
        if (maxDelay > 5) return 'yellow';
        return 'green';
    };
    // Handle hold toggle - track on hold date and days
    const handleHoldToggle = (edit, setEdit, newHoldState)=>{
        const today = new Date().toISOString().split('T')[0];
        if (newHoldState && !edit.wasOnHold) {
            // Going ON hold - set on hold date
            setEdit({
                ...edit,
                hasHold: true,
                onHoldDate: today,
                wasOnHold: true
            });
        } else if (!newHoldState && edit.wasOnHold && edit.onHoldDate) {
            // Coming OFF hold - calculate days on hold
            const holdStart = new Date(edit.onHoldDate);
            const holdEnd = new Date();
            const diffTime = Math.abs(holdEnd.getTime() - holdStart.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const newDaysOnHold = edit.daysOnHold + diffDays;
            setEdit({
                ...edit,
                hasHold: false,
                daysOnHold: newDaysOnHold,
                wasOnHold: false,
                onHoldDate: ''
            });
        } else {
            setEdit({
                ...edit,
                hasHold: newHoldState
            });
        }
    };
    const stats = {
        total: currentJobs.length,
        active: currentJobs.filter((j_0)=>j_0.Status === 'Active').length,
        onHold: currentJobs.filter((j_1)=>j_1.Status === 'On Hold').length,
        byType: currentJobs.reduce((acc, job_1)=>{
            const type = job_1.job_type || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {})
    };
    const chartData = Object.entries(stats.byType).map(([name, count_0])=>({
            name,
            count: count_0
        }));
    const handleSort = (key)=>setSortConfig((prev_0)=>({
                key,
                direction: prev_0.key === key && prev_0.direction === 'asc' ? 'desc' : 'asc'
            }));
    const filteredJobs = currentJobs.filter((job_2)=>{
        if (statusFilter === 'active' && job_2.Status !== 'Active') return false;
        if (statusFilter === 'onhold' && job_2.Status !== 'On Hold') return false;
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return job_2.name?.toLowerCase().includes(search) || job_2.customer?.toLowerCase().includes(search) || job_2.shop_pn?.toLowerCase().includes(search) || job_2.cust_pn?.toLowerCase().includes(search) || job_2['PCB Eng']?.toLowerCase().includes(search) || job_2['ASM Eng']?.toLowerCase().includes(search) || job_2.account_mngr?.toLowerCase().includes(search) || job_2.program?.toLowerCase().includes(search);
        }
        return true;
    }).sort((a, b)=>{
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key], bVal = b[sortConfig.key];
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        let cmp = typeof aVal === 'string' && typeof bVal === 'string' ? aVal.localeCompare(bVal) : typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
        return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
    const resetEditState = ()=>{
        setHdwEdit({
            text: '',
            hasHold: false,
            owner: '',
            target: '',
            action: '',
            onHoldDate: '',
            daysOnHold: 0,
            wasOnHold: false
        });
        setPcbEdit({
            text: '',
            hasHold: false,
            owner: '',
            target: '',
            action: '',
            onHoldDate: '',
            daysOnHold: 0,
            wasOnHold: false
        });
        setAsmEdit({
            text: '',
            hasHold: false,
            owner: '',
            target: '',
            action: '',
            onHoldDate: '',
            daysOnHold: 0,
            wasOnHold: false
        });
        setScheduleEdit({
            hdw_date: '',
            hdw_complete: false,
            bom_date: '',
            bom_complete: false,
            cam_date: '',
            cam_complete: false,
            rev_date: '',
            rev_complete: false,
            prl_date: '',
            prl_complete: false,
            arl_date: '',
            arl_complete: false
        });
    };
    const openJobModal = (job_3)=>{
        setSelectedJob(job_3);
        setEditingJob({
            ...job_3
        });
        setStatusNotes([]);
        resetEditState();
        setModalOpen(true);
        if (job_3.name) fetchJobNotes(job_3.name);
    };
    const closeModal = ()=>{
        setModalOpen(false);
        setSelectedJob(null);
        setEditingJob({});
        setStatusNotes([]);
        resetEditState();
    };
    const saveJobChanges = async ()=>{
        setSavingJob(true);
        try {
            // Build notes string with hold info and CAM/REV dates
            const buildSectionNotes = (tag, edit_0)=>{
                let section = `[${tag}] ${edit_0.text}`;
                if (edit_0.hasHold && edit_0.owner && edit_0.target && edit_0.action) {
                    const targetDate = new Date(edit_0.target);
                    const targetStr = `${targetDate.getMonth() + 1}/${targetDate.getDate()}/${targetDate.getFullYear()}`;
                    section += ` [Owner: ${edit_0.owner}; Target: ${targetStr}; Action: ${edit_0.action}]`;
                }
                if (edit_0.onHoldDate) {
                    const holdDate = new Date(edit_0.onHoldDate);
                    section += ` [On Hold: ${holdDate.getMonth() + 1}/${holdDate.getDate()}/${holdDate.getFullYear()}]`;
                }
                if (edit_0.daysOnHold > 0) {
                    section += ` [Days On Hold: ${edit_0.daysOnHold}]`;
                }
                return section;
            };
            // Format CAM/REV for notes - either date or "Complete"
            const formatCamRevNote = (tag_0, date, complete)=>{
                if (complete) return `[${tag_0}: Complete]`;
                if (date) {
                    const d_0 = new Date(date);
                    return `[${tag_0}: ${d_0.getMonth() + 1}/${d_0.getDate()}/${d_0.getFullYear()}]`;
                }
                return '';
            };
            const notes_0 = [
                buildSectionNotes('HDW', hdwEdit),
                buildSectionNotes('PCB', pcbEdit),
                formatCamRevNote('CAM', scheduleEdit.cam_date, scheduleEdit.cam_complete),
                formatCamRevNote('Rev', scheduleEdit.rev_date, scheduleEdit.rev_complete),
                buildSectionNotes('ASM', asmEdit)
            ].filter(Boolean).join('\n');
            // Build schedule data for API
            const scheduleData = {
                hdw_date: scheduleEdit.hdw_complete ? null : scheduleEdit.hdw_date,
                hdw_complete: scheduleEdit.hdw_complete,
                bom_date: scheduleEdit.bom_complete ? null : scheduleEdit.bom_date,
                bom_complete: scheduleEdit.bom_complete,
                prl_date: scheduleEdit.prl_complete ? null : scheduleEdit.prl_date,
                prl_complete: scheduleEdit.prl_complete,
                arl_date: scheduleEdit.arl_complete ? null : scheduleEdit.arl_date,
                arl_complete: scheduleEdit.arl_complete
            };
            // Save to database - create new record
            const res_3 = await fetch('/api/admin/job-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobName: selectedJob?.name,
                    notes: notes_0,
                    hdw_date: scheduleData.hdw_complete ? null : scheduleEdit.hdw_date,
                    bom_date: scheduleData.bom_complete ? null : scheduleEdit.bom_date,
                    prl_date: scheduleData.prl_complete ? null : scheduleEdit.prl_date,
                    arl_date: scheduleData.arl_complete ? null : scheduleEdit.arl_date
                })
            });
            // Check content type before parsing
            const contentType = res_3.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server error (${res_3.status}): Expected JSON response but got ${contentType || 'unknown'}. Check if the API endpoint exists.`);
            }
            const data_3 = await res_3.json();
            if (!res_3.ok) {
                throw new Error(data_3.error || 'Failed to save');
            }
            // Update local state
            setCurrentJobs((prev_1)=>prev_1.map((job_4)=>job_4.id === selectedJob?.id ? {
                        ...job_4,
                        ...editingJob
                    } : job_4));
            closeModal();
        } catch (err_3) {
            console.error('Error saving job:', err_3);
            alert(err_3 instanceof Error ? err_3.message : 'Failed to save changes');
        } finally{
            setSavingJob(false);
        }
    };
    const formatDate = (dateStr)=>{
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch  {
            return dateStr;
        }
    };
    const SortIcon = ({ column })=>{
        if (sortConfig.key === column) return sortConfig.direction === 'asc' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__["ArrowUp"], {
            size: 14
        }, void 0, false, {
            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
            lineNumber: 577,
            columnNumber: 76
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__["ArrowDown"], {
            size: 14
        }, void 0, false, {
            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
            lineNumber: 577,
            columnNumber: 100
        }, this);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpDown$3e$__["ArrowUpDown"], {
            size: 14,
            className: "text-slate-400"
        }, void 0, false, {
            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
            lineNumber: 578,
            columnNumber: 12
        }, this);
    };
    // Get baseline (oldest) and latest (newest) records
    const baseline_0 = statusNotes.length > 0 ? statusNotes[statusNotes.length - 1] : null;
    const latest_1 = statusNotes.length > 0 ? statusNotes[0] : null;
    const isOnHold_0 = selectedJob?.Status === 'On Hold';
    const scheduleStatus = getScheduleStatus(baseline_0, latest_1, isOnHold_0);
    // Section Edit Component
    const SectionEditCard = ({ title, icon, edit: edit_1, setEdit: setEdit_0, color })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `border rounded-lg p-4 ${edit_1.hasHold ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between mb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                            className: `font-semibold flex items-center gap-2 ${color}`,
                            children: [
                                icon,
                                title
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                            lineNumber: 602,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "flex items-center gap-2 text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: edit_1.hasHold,
                                    onChange: (e)=>handleHoldToggle(edit_1, setEdit_0, e.target.checked),
                                    className: "w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 604,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: edit_1.hasHold ? 'text-amber-700 font-medium' : 'text-slate-600',
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                            size: 14,
                                            className: "inline mr-1"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 606,
                                            columnNumber: 13
                                        }, this),
                                        "Hold"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 605,
                                    columnNumber: 11
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                            lineNumber: 603,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                    lineNumber: 601,
                    columnNumber: 7
                }, this),
                edit_1.daysOnHold > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-2 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded",
                    children: [
                        "Total days on hold: ",
                        edit_1.daysOnHold
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                    lineNumber: 611,
                    columnNumber: 33
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "block text-xs font-medium text-slate-500 mb-1",
                            children: "Notes"
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                            lineNumber: 616,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                            value: edit_1.text,
                            onChange: (e_0)=>setEdit_0({
                                    ...edit_1,
                                    text: e_0.target.value
                                }),
                            placeholder: `${title} notes...`,
                            className: "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 h-16 resize-none"
                        }, void 0, false, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                            lineNumber: 617,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                    lineNumber: 615,
                    columnNumber: 7
                }, this),
                edit_1.hasHold && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-amber-100 rounded-lg p-3 space-y-2 border border-amber-200",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs font-semibold text-amber-800 flex items-center gap-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                    size: 12
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 625,
                                    columnNumber: 13
                                }, this),
                                "Hold Information",
                                edit_1.onHoldDate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "ml-2 font-normal",
                                    children: [
                                        "(Since: ",
                                        formatDate(edit_1.onHoldDate),
                                        ")"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 626,
                                    columnNumber: 35
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                            lineNumber: 624,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-xs font-medium text-amber-700 mb-1",
                                            children: "Owner"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 630,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            value: edit_1.owner,
                                            onChange: (e_1)=>setEdit_0({
                                                    ...edit_1,
                                                    owner: e_1.target.value
                                                }),
                                            placeholder: "Person responsible",
                                            className: "w-full px-2 py-1 border border-amber-300 rounded text-sm bg-white"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 631,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 629,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "block text-xs font-medium text-amber-700 mb-1",
                                            children: "Target Date"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 637,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "date",
                                            value: edit_1.target,
                                            onChange: (e_2)=>setEdit_0({
                                                    ...edit_1,
                                                    target: e_2.target.value
                                                }),
                                            className: "w-full px-2 py-1 border border-amber-300 rounded text-sm bg-white"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 638,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 636,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                            lineNumber: 628,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block text-xs font-medium text-amber-700 mb-1",
                                    children: "Action Required"
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 645,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    value: edit_1.action,
                                    onChange: (e_3)=>setEdit_0({
                                            ...edit_1,
                                            action: e_3.target.value
                                        }),
                                    placeholder: "What needs to be done",
                                    className: "w-full px-2 py-1 border border-amber-300 rounded text-sm bg-white"
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 646,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                            lineNumber: 644,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                    lineNumber: 623,
                    columnNumber: 26
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
            lineNumber: 600,
            columnNumber: 9
        }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/admin",
                                className: "p-2 hover:bg-slate-100 rounded-lg transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                    size: 20
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 656,
                                    columnNumber: 95
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 656,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-bold text-slate-800",
                                        children: "Manage Backlog"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 658,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-slate-600",
                                        children: "View, edit, and manage current jobs and backlog"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 659,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 657,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                        lineNumber: 655,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleRefresh,
                                disabled: refreshing,
                                className: "flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                        size: 16,
                                        className: refreshing ? 'animate-spin' : ''
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 664,
                                        columnNumber: 13
                                    }, this),
                                    "Refresh"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 663,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                        size: 16
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 666,
                                        columnNumber: 117
                                    }, this),
                                    "Add Job"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 666,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                        lineNumber: 662,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                lineNumber: 654,
                columnNumber: 7
            }, this),
            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-semibold",
                        children: "Error loading data"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                        lineNumber: 671,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                        lineNumber: 671,
                        columnNumber: 62
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: fetchCurrentJobs,
                        className: "mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                        lineNumber: 672,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                lineNumber: 670,
                columnNumber: 16
            }, this) : loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-12",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                        className: "animate-spin mx-auto mb-4",
                        size: 32
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                        lineNumber: 673,
                        columnNumber: 63
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-slate-600",
                        children: "Loading..."
                    }, void 0, false, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                        lineNumber: 673,
                        columnNumber: 124
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                lineNumber: 673,
                columnNumber: 28
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-lg shadow p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-slate-800 mb-4",
                                children: "Jobs by Type"
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 675,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResponsiveContainer"], {
                                width: "100%",
                                height: 200,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$BarChart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BarChart"], {
                                    data: chartData,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianGrid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CartesianGrid"], {
                                            strokeDasharray: "3 3"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 677,
                                            columnNumber: 42
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$XAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["XAxis"], {
                                            dataKey: "name"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 677,
                                            columnNumber: 81
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$YAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["YAxis"], {}, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 677,
                                            columnNumber: 105
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {}, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 677,
                                            columnNumber: 114
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Bar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Bar"], {
                                            dataKey: "count",
                                            fill: "#10b981"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 677,
                                            columnNumber: 125
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 677,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 676,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                        lineNumber: 674,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-4 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setStatusFilter('all'),
                                className: `bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 transition-all text-left ${statusFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-200 hover:border-blue-300'}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-blue-700 font-medium",
                                                        children: "Total Jobs"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 683,
                                                        columnNumber: 71
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-3xl font-bold text-blue-900 mt-1",
                                                        children: stats.total
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 683,
                                                        columnNumber: 134
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                lineNumber: 683,
                                                columnNumber: 66
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"], {
                                                className: "text-blue-600",
                                                size: 32
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                lineNumber: 683,
                                                columnNumber: 210
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 683,
                                        columnNumber: 15
                                    }, this),
                                    statusFilter === 'all' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-blue-600 mt-2",
                                        children: "✓ Showing all"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 684,
                                        columnNumber: 42
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 682,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setStatusFilter('active'),
                                className: `bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 transition-all text-left ${statusFilter === 'active' ? 'border-green-500 ring-2 ring-green-200' : 'border-green-200 hover:border-green-300'}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-green-700 font-medium",
                                                        children: "Active"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 687,
                                                        columnNumber: 71
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-3xl font-bold text-green-900 mt-1",
                                                        children: stats.active
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 687,
                                                        columnNumber: 131
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                lineNumber: 687,
                                                columnNumber: 66
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlayCircle$3e$__["PlayCircle"], {
                                                className: "text-green-600",
                                                size: 32
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                lineNumber: 687,
                                                columnNumber: 209
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 687,
                                        columnNumber: 15
                                    }, this),
                                    statusFilter === 'active' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-green-600 mt-2",
                                        children: "✓ Filtered"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 688,
                                        columnNumber: 45
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 686,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setStatusFilter('onhold'),
                                className: `bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border-2 transition-all text-left ${statusFilter === 'onhold' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-200 hover:border-amber-300'}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-amber-700 font-medium",
                                                        children: "On Hold"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 691,
                                                        columnNumber: 71
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-3xl font-bold text-amber-900 mt-1",
                                                        children: stats.onHold
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 691,
                                                        columnNumber: 132
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                lineNumber: 691,
                                                columnNumber: 66
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$pause$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PauseCircle$3e$__["PauseCircle"], {
                                                className: "text-amber-600",
                                                size: 32
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                lineNumber: 691,
                                                columnNumber: 210
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 691,
                                        columnNumber: 15
                                    }, this),
                                    statusFilter === 'onhold' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-amber-600 mt-2",
                                        children: "✓ Filtered"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 692,
                                        columnNumber: 45
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 690,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-purple-700 font-medium",
                                                    children: "Job Types"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 695,
                                                    columnNumber: 71
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-3xl font-bold text-purple-900 mt-1",
                                                    children: Object.keys(stats.byType).length
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 695,
                                                    columnNumber: 135
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 695,
                                            columnNumber: 66
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                            className: "text-purple-600",
                                            size: 32
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 695,
                                            columnNumber: 234
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 695,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 694,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                        lineNumber: 681,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-lg shadow",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4 border-b border-slate-200",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-lg font-semibold text-slate-800",
                                                    children: statusFilter === 'all' ? 'All Jobs' : statusFilter === 'active' ? 'Active Jobs' : 'On Hold Jobs'
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 703,
                                                    columnNumber: 19
                                                }, this),
                                                statusFilter !== 'all' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setStatusFilter('all'),
                                                    className: "text-sm text-blue-600 hover:underline",
                                                    children: "Clear filter"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 704,
                                                    columnNumber: 46
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 702,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                                    className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400",
                                                    size: 16
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 707,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    placeholder: "Search jobs...",
                                                    value: searchTerm,
                                                    onChange: (e_4)=>setSearchTerm(e_4.target.value),
                                                    className: "pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 708,
                                                    columnNumber: 19
                                                }, this),
                                                searchTerm && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setSearchTerm(''),
                                                    className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 709,
                                                        columnNumber: 166
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 709,
                                                    columnNumber: 34
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 706,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 701,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 700,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "overflow-x-auto",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "max-h-[400px] overflow-y-auto",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "w-full text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                className: "bg-slate-100 sticky top-0",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200",
                                                            onClick: ()=>handleSort('Status'),
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-1",
                                                                children: [
                                                                    "Status",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortIcon, {
                                                                        column: "Status"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 717,
                                                                        columnNumber: 202
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 717,
                                                                columnNumber: 155
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 717,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200",
                                                            onClick: ()=>handleSort('release_status'),
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-1",
                                                                children: [
                                                                    "Release",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortIcon, {
                                                                        column: "release_status"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 718,
                                                                        columnNumber: 211
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 718,
                                                                columnNumber: 163
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 718,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200",
                                                            onClick: ()=>handleSort('program'),
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-1",
                                                                children: [
                                                                    "Program",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortIcon, {
                                                                        column: "program"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 719,
                                                                        columnNumber: 204
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 719,
                                                                columnNumber: 156
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 719,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200",
                                                            onClick: ()=>handleSort('name'),
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-1",
                                                                children: [
                                                                    "Job Name",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortIcon, {
                                                                        column: "name"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 720,
                                                                        columnNumber: 202
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 720,
                                                                columnNumber: 153
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 720,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200",
                                                            onClick: ()=>handleSort('customer'),
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-1",
                                                                children: [
                                                                    "Customer",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortIcon, {
                                                                        column: "customer"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 721,
                                                                        columnNumber: 206
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 721,
                                                                columnNumber: 157
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 721,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200",
                                                            onClick: ()=>handleSort('job_type'),
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-1",
                                                                children: [
                                                                    "Type",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortIcon, {
                                                                        column: "job_type"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 722,
                                                                        columnNumber: 202
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 722,
                                                                columnNumber: 157
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 722,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200",
                                                            onClick: ()=>handleSort('shop_pn'),
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-1",
                                                                children: [
                                                                    "Shop PN",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortIcon, {
                                                                        column: "shop_pn"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 723,
                                                                        columnNumber: 204
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 723,
                                                                columnNumber: 156
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 723,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200",
                                                            onClick: ()=>handleSort('PCB Eng'),
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-1",
                                                                children: [
                                                                    "PCB",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortIcon, {
                                                                        column: "PCB Eng"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 724,
                                                                        columnNumber: 200
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 724,
                                                                columnNumber: 156
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 724,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left px-3 py-2 font-medium text-slate-700 cursor-pointer hover:bg-slate-200",
                                                            onClick: ()=>handleSort('ASM Eng'),
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-1",
                                                                children: [
                                                                    "ASM",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortIcon, {
                                                                        column: "ASM Eng"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 725,
                                                                        columnNumber: 200
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 725,
                                                                columnNumber: 156
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 725,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 716,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                lineNumber: 715,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                children: filteredJobs.map((job_5)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: "border-t border-slate-200 hover:bg-blue-50 cursor-pointer",
                                                        onClick: ()=>openJobModal(job_5),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-2",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: `px-2 py-0.5 rounded-full text-xs font-medium ${job_5.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`,
                                                                    children: job_5.Status
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 730,
                                                                    columnNumber: 49
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 730,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-2",
                                                                children: job_5.release_status ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: `px-2 py-0.5 rounded text-xs ${job_5.release_status === 'Released' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`,
                                                                    children: job_5.release_status
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 731,
                                                                    columnNumber: 73
                                                                }, this) : '-'
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 731,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-2",
                                                                children: job_5.program ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs",
                                                                    children: job_5.program
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 732,
                                                                    columnNumber: 66
                                                                }, this) : '-'
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 732,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-2 font-medium",
                                                                children: job_5.name
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 733,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-2",
                                                                children: job_5.customer || '-'
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 734,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-2",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs",
                                                                    children: job_5.job_type || '-'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 735,
                                                                    columnNumber: 49
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 735,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-2 font-mono text-xs",
                                                                children: job_5.shop_pn || '-'
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 736,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-2 text-xs",
                                                                children: job_5['PCB Eng'] || '-'
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 737,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-3 py-2 text-xs",
                                                                children: job_5['ASM Eng'] || '-'
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 738,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, job_5.id, true, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 729,
                                                        columnNumber: 46
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                lineNumber: 728,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                        lineNumber: 714,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 713,
                                    columnNumber: 46
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 713,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-600",
                                children: [
                                    "Showing ",
                                    filteredJobs.length,
                                    " of ",
                                    currentJobs.length,
                                    " jobs • Click row to edit"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                lineNumber: 743,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                        lineNumber: 699,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                lineNumber: 673,
                columnNumber: 177
            }, this),
            modalOpen && selectedJob && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-xl font-bold text-slate-800",
                                            children: selectedJob.name
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 754,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-slate-600",
                                            children: [
                                                selectedJob.customer,
                                                " • ",
                                                selectedJob.job_type,
                                                " • ",
                                                selectedJob.shop_pn
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 755,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 753,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: saveJobChanges,
                                            disabled: savingJob,
                                            className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                                    size: 16
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 758,
                                                    columnNumber: 189
                                                }, this),
                                                savingJob ? 'Saving...' : 'Save Changes'
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 758,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: closeModal,
                                            className: "p-2 hover:bg-slate-200 rounded-lg",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                size: 20
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                lineNumber: 759,
                                                columnNumber: 92
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 759,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 757,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                            lineNumber: 752,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 overflow-y-auto p-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-3 gap-4 mb-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-semibold text-slate-800 flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 767,
                                                            columnNumber: 88
                                                        }, this),
                                                        "Job Info"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 767,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-2 gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-xs text-slate-500 mb-1",
                                                                    children: "Status"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 769,
                                                                    columnNumber: 26
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                    value: editingJob.Status || '',
                                                                    onChange: (e_5)=>setEditingJob((p)=>({
                                                                                ...p,
                                                                                Status: e_5.target.value
                                                                            })),
                                                                    className: "w-full px-2 py-1.5 border rounded text-sm",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                            value: "Active",
                                                                            children: "Active"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 774,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                            value: "On Hold",
                                                                            children: "On Hold"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 774,
                                                                            columnNumber: 63
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 770,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 769,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-xs text-slate-500 mb-1",
                                                                    children: "Type"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 777,
                                                                    columnNumber: 26
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "text",
                                                                    value: editingJob.job_type || '',
                                                                    onChange: (e_6)=>setEditingJob((p_0)=>({
                                                                                ...p_0,
                                                                                job_type: e_6.target.value
                                                                            })),
                                                                    className: "w-full px-2 py-1.5 border rounded text-sm"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 778,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 777,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 768,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "block text-xs text-slate-500 mb-1",
                                                            children: "Customer"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 784,
                                                            columnNumber: 24
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "text",
                                                            value: editingJob.customer || '',
                                                            onChange: (e_7)=>setEditingJob((p_1)=>({
                                                                        ...p_1,
                                                                        customer: e_7.target.value
                                                                    })),
                                                            className: "w-full px-2 py-1.5 border rounded text-sm"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 785,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 784,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-2 gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-xs text-slate-500 mb-1",
                                                                    children: "Shop PN"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 791,
                                                                    columnNumber: 26
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "text",
                                                                    value: editingJob.shop_pn || '',
                                                                    onChange: (e_8)=>setEditingJob((p_2)=>({
                                                                                ...p_2,
                                                                                shop_pn: e_8.target.value
                                                                            })),
                                                                    className: "w-full px-2 py-1.5 border rounded text-sm font-mono"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 792,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 791,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-xs text-slate-500 mb-1",
                                                                    children: "Cust PN"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 797,
                                                                    columnNumber: 26
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "text",
                                                                    value: editingJob.cust_pn || '',
                                                                    onChange: (e_9)=>setEditingJob((p_3)=>({
                                                                                ...p_3,
                                                                                cust_pn: e_9.target.value
                                                                            })),
                                                                    className: "w-full px-2 py-1.5 border rounded text-sm font-mono"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 798,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 797,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 790,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 766,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-semibold text-slate-800 flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 807,
                                                            columnNumber: 88
                                                        }, this),
                                                        "Assignments"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 807,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-2 gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-xs text-slate-500 mb-1",
                                                                    children: "PCB Eng"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 809,
                                                                    columnNumber: 26
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                    value: editingJob['PCB Eng'] || '',
                                                                    onChange: (e_10)=>setEditingJob((p_4)=>({
                                                                                ...p_4,
                                                                                'PCB Eng': e_10.target.value
                                                                            })),
                                                                    className: "w-full px-2 py-1.5 border rounded text-sm",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                            value: "",
                                                                            children: "-- Select --"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 814,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        pcbEngineers.map((eng)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: eng.ccName || eng.name || eng.username,
                                                                                children: eng.ccName || eng.name || eng.username
                                                                            }, eng.userId, false, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 815,
                                                                                columnNumber: 50
                                                                            }, this))
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 810,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 809,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-xs text-slate-500 mb-1",
                                                                    children: "ASM Eng"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 820,
                                                                    columnNumber: 26
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                    value: editingJob['ASM Eng'] || '',
                                                                    onChange: (e_11)=>setEditingJob((p_5)=>({
                                                                                ...p_5,
                                                                                'ASM Eng': e_11.target.value
                                                                            })),
                                                                    className: "w-full px-2 py-1.5 border rounded text-sm",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                            value: "",
                                                                            children: "-- Select --"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 825,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        asmEngineers.map((eng_0)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: eng_0.ccName || eng_0.name || eng_0.username,
                                                                                children: eng_0.ccName || eng_0.name || eng_0.username
                                                                            }, eng_0.userId, false, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 826,
                                                                                columnNumber: 52
                                                                            }, this))
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 821,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 820,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 808,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-2 gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-xs text-slate-500 mb-1",
                                                                    children: "CAM Eng"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 833,
                                                                    columnNumber: 26
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                    value: editingJob['CAM Eng'] || '',
                                                                    onChange: (e_12)=>setEditingJob((p_6)=>({
                                                                                ...p_6,
                                                                                'CAM Eng': e_12.target.value
                                                                            })),
                                                                    className: "w-full px-2 py-1.5 border rounded text-sm",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                            value: "",
                                                                            children: "-- Select --"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 838,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        camEngineers.map((eng_1)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: eng_1.ccName || eng_1.name || eng_1.username,
                                                                                children: eng_1.ccName || eng_1.name || eng_1.username
                                                                            }, eng_1.userId, false, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 839,
                                                                                columnNumber: 52
                                                                            }, this))
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 834,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 833,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-xs text-slate-500 mb-1",
                                                                    children: "Acct Mgr"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 844,
                                                                    columnNumber: 26
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "text",
                                                                    value: editingJob.account_mngr || '',
                                                                    onChange: (e_13)=>setEditingJob((p_7)=>({
                                                                                ...p_7,
                                                                                account_mngr: e_13.target.value
                                                                            })),
                                                                    className: "w-full px-2 py-1.5 border rounded text-sm"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 845,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 844,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 832,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 806,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-semibold text-slate-800 flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"], {
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 854,
                                                            columnNumber: 88
                                                        }, this),
                                                        "Paradigm (Read-only)"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 854,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-2 gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-xs text-slate-500 mb-1",
                                                                    children: "Release"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 856,
                                                                    columnNumber: 26
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "px-2 py-1.5 bg-slate-100 rounded text-sm",
                                                                    children: selectedJob.release_status || '-'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 857,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 856,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    className: "block text-xs text-slate-500 mb-1",
                                                                    children: "Program"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 859,
                                                                    columnNumber: 26
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "px-2 py-1.5 bg-slate-100 rounded text-sm",
                                                                    children: selectedJob.program || '-'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 860,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 859,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 855,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 853,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 765,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mb-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-semibold text-slate-800 flex items-center gap-2 mb-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
                                                    size: 18
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 868,
                                                    columnNumber: 91
                                                }, this),
                                                "Section Notes"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 868,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-3 gap-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionEditCard, {
                                                    title: "HDW",
                                                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 870,
                                                        columnNumber: 54
                                                    }, void 0),
                                                    edit: hdwEdit,
                                                    setEdit: setHdwEdit,
                                                    color: "text-blue-700"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 870,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionEditCard, {
                                                    title: "PCB",
                                                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 871,
                                                        columnNumber: 54
                                                    }, void 0),
                                                    edit: pcbEdit,
                                                    setEdit: setPcbEdit,
                                                    color: "text-green-700"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 871,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionEditCard, {
                                                    title: "ASM",
                                                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                                        size: 14
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                        lineNumber: 872,
                                                        columnNumber: 54
                                                    }, void 0),
                                                    edit: asmEdit,
                                                    setEdit: setAsmEdit,
                                                    color: "text-purple-700"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 872,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 869,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 867,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-semibold text-slate-800 flex items-center gap-2 mb-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                                    size: 18
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 878,
                                                    columnNumber: 91
                                                }, this),
                                                "Schedule Timeline"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 878,
                                            columnNumber: 17
                                        }, this),
                                        loadingNotes ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center py-6",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                                className: "animate-spin mx-auto",
                                                size: 24
                                            }, void 0, false, {
                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                lineNumber: 880,
                                                columnNumber: 67
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 880,
                                            columnNumber: 33
                                        }, this) : statusNotes.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center py-6 bg-slate-50 rounded-lg border",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                    size: 24,
                                                    className: "mx-auto mb-2 text-slate-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 880,
                                                    columnNumber: 223
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-slate-500 text-sm",
                                                    children: "No schedule records found"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 880,
                                                    columnNumber: 282
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 880,
                                            columnNumber: 159
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `border rounded-lg overflow-hidden ${scheduleStatus === 'red' ? 'border-red-300' : scheduleStatus === 'yellow' ? 'border-amber-300' : scheduleStatus === 'green' ? 'border-green-300' : 'border-slate-200'}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                    className: "w-full text-sm",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                            className: "bg-slate-100",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "text-left px-3 py-2 font-medium text-slate-700",
                                                                        children: "Row"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 884,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "text-left px-3 py-2 font-medium text-slate-700",
                                                                        children: "Timestamp"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 885,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "text-center px-3 py-2 font-medium text-slate-700",
                                                                        children: "HDW"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 886,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "text-center px-3 py-2 font-medium text-slate-700",
                                                                        children: "BOM"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 887,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "text-center px-3 py-2 font-medium text-slate-700",
                                                                        children: "CAM"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 888,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "text-center px-3 py-2 font-medium text-slate-700",
                                                                        children: "REV"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 889,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "text-center px-3 py-2 font-medium text-slate-700",
                                                                        children: "PRL"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 890,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "text-center px-3 py-2 font-medium text-slate-700",
                                                                        children: "ARL"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                        lineNumber: 891,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                lineNumber: 883,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 882,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                            children: [
                                                                baseline_0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    className: "border-t bg-slate-50",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 font-medium text-slate-600",
                                                                            children: "Baseline"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 897,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-xs text-slate-500",
                                                                            children: baseline_0.timestampFormatted
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 898,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-center text-xs",
                                                                            children: formatDate(baseline_0.hdw_date)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 899,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-center text-xs",
                                                                            children: formatDate(baseline_0.bom_date)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 900,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-center text-xs",
                                                                            children: baseline_0.cam_complete ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-green-600",
                                                                                children: "✓"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 901,
                                                                                columnNumber: 102
                                                                            }, this) : formatDate(baseline_0.cam_date)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 901,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-center text-xs",
                                                                            children: baseline_0.rev_complete ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "text-green-600",
                                                                                children: "✓"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 902,
                                                                                columnNumber: 102
                                                                            }, this) : formatDate(baseline_0.rev_date)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 902,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-center text-xs",
                                                                            children: formatDate(baseline_0.prl_date)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 903,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-center text-xs",
                                                                            children: formatDate(baseline_0.arl_date)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 904,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 896,
                                                                    columnNumber: 40
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    className: `border-t ${scheduleStatus === 'red' ? 'bg-red-50' : scheduleStatus === 'yellow' ? 'bg-amber-50' : scheduleStatus === 'green' ? 'bg-green-50' : 'bg-blue-50'}`,
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 font-medium text-slate-700",
                                                                            children: "Latest"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 908,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2 text-xs",
                                                                            children: latest_1?.timestampFormatted || 'New'
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 909,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-center gap-1",
                                                                                children: [
                                                                                    !scheduleEdit.hdw_complete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "date",
                                                                                        value: scheduleEdit.hdw_date,
                                                                                        onChange: (e_14)=>setScheduleEdit((p_8)=>({
                                                                                                    ...p_8,
                                                                                                    hdw_date: e_14.target.value
                                                                                                })),
                                                                                        className: "w-full px-1 py-0.5 border rounded text-xs"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 912,
                                                                                        columnNumber: 62
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                        className: "flex items-center gap-1 text-xs whitespace-nowrap",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                type: "checkbox",
                                                                                                checked: scheduleEdit.hdw_complete,
                                                                                                onChange: (e_15)=>setScheduleEdit((p_9)=>({
                                                                                                            ...p_9,
                                                                                                            hdw_complete: e_15.target.checked
                                                                                                        })),
                                                                                                className: "w-3 h-3"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                                lineNumber: 916,
                                                                                                columnNumber: 100
                                                                                            }, this),
                                                                                            "Done"
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 916,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 911,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 910,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-center gap-1",
                                                                                children: [
                                                                                    !scheduleEdit.bom_complete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "date",
                                                                                        value: scheduleEdit.bom_date,
                                                                                        onChange: (e_16)=>setScheduleEdit((p_10)=>({
                                                                                                    ...p_10,
                                                                                                    bom_date: e_16.target.value
                                                                                                })),
                                                                                        className: "w-full px-1 py-0.5 border rounded text-xs"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 924,
                                                                                        columnNumber: 62
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                        className: "flex items-center gap-1 text-xs whitespace-nowrap",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                type: "checkbox",
                                                                                                checked: scheduleEdit.bom_complete,
                                                                                                onChange: (e_17)=>setScheduleEdit((p_11)=>({
                                                                                                            ...p_11,
                                                                                                            bom_complete: e_17.target.checked
                                                                                                        })),
                                                                                                className: "w-3 h-3"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                                lineNumber: 928,
                                                                                                columnNumber: 100
                                                                                            }, this),
                                                                                            "Done"
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 928,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 923,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 922,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-center gap-1",
                                                                                children: [
                                                                                    !scheduleEdit.cam_complete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "date",
                                                                                        value: scheduleEdit.cam_date,
                                                                                        onChange: (e_18)=>setScheduleEdit((p_12)=>({
                                                                                                    ...p_12,
                                                                                                    cam_date: e_18.target.value
                                                                                                })),
                                                                                        className: "w-full px-1 py-0.5 border rounded text-xs"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 936,
                                                                                        columnNumber: 62
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                        className: "flex items-center gap-1 text-xs whitespace-nowrap",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                type: "checkbox",
                                                                                                checked: scheduleEdit.cam_complete,
                                                                                                onChange: (e_19)=>setScheduleEdit((p_13)=>({
                                                                                                            ...p_13,
                                                                                                            cam_complete: e_19.target.checked
                                                                                                        })),
                                                                                                className: "w-3 h-3"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                                lineNumber: 940,
                                                                                                columnNumber: 100
                                                                                            }, this),
                                                                                            "Done"
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 940,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 935,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 934,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-center gap-1",
                                                                                children: [
                                                                                    !scheduleEdit.rev_complete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "date",
                                                                                        value: scheduleEdit.rev_date,
                                                                                        onChange: (e_20)=>setScheduleEdit((p_14)=>({
                                                                                                    ...p_14,
                                                                                                    rev_date: e_20.target.value
                                                                                                })),
                                                                                        className: "w-full px-1 py-0.5 border rounded text-xs"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 948,
                                                                                        columnNumber: 62
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                        className: "flex items-center gap-1 text-xs whitespace-nowrap",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                type: "checkbox",
                                                                                                checked: scheduleEdit.rev_complete,
                                                                                                onChange: (e_21)=>setScheduleEdit((p_15)=>({
                                                                                                            ...p_15,
                                                                                                            rev_complete: e_21.target.checked
                                                                                                        })),
                                                                                                className: "w-3 h-3"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                                lineNumber: 952,
                                                                                                columnNumber: 100
                                                                                            }, this),
                                                                                            "Done"
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 952,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 947,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 946,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-center gap-1",
                                                                                children: [
                                                                                    !scheduleEdit.prl_complete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "date",
                                                                                        value: scheduleEdit.prl_date,
                                                                                        onChange: (e_22)=>setScheduleEdit((p_16)=>({
                                                                                                    ...p_16,
                                                                                                    prl_date: e_22.target.value
                                                                                                })),
                                                                                        className: "w-full px-1 py-0.5 border rounded text-xs"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 960,
                                                                                        columnNumber: 62
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                        className: "flex items-center gap-1 text-xs whitespace-nowrap",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                type: "checkbox",
                                                                                                checked: scheduleEdit.prl_complete,
                                                                                                onChange: (e_23)=>setScheduleEdit((p_17)=>({
                                                                                                            ...p_17,
                                                                                                            prl_complete: e_23.target.checked
                                                                                                        })),
                                                                                                className: "w-3 h-3"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                                lineNumber: 964,
                                                                                                columnNumber: 100
                                                                                            }, this),
                                                                                            "Done"
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 964,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 959,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 958,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-3 py-2",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-center gap-1",
                                                                                children: [
                                                                                    !scheduleEdit.arl_complete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "date",
                                                                                        value: scheduleEdit.arl_date,
                                                                                        onChange: (e_24)=>setScheduleEdit((p_18)=>({
                                                                                                    ...p_18,
                                                                                                    arl_date: e_24.target.value
                                                                                                })),
                                                                                        className: "w-full px-1 py-0.5 border rounded text-xs"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 972,
                                                                                        columnNumber: 62
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                        className: "flex items-center gap-1 text-xs whitespace-nowrap",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                type: "checkbox",
                                                                                                checked: scheduleEdit.arl_complete,
                                                                                                onChange: (e_25)=>setScheduleEdit((p_19)=>({
                                                                                                            ...p_19,
                                                                                                            arl_complete: e_25.target.checked
                                                                                                        })),
                                                                                                className: "w-3 h-3"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                                lineNumber: 976,
                                                                                                columnNumber: 100
                                                                                            }, this),
                                                                                            "Done"
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                        lineNumber: 976,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                                lineNumber: 971,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                            lineNumber: 970,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                                    lineNumber: 907,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 894,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 881,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `p-2 text-xs ${scheduleStatus === 'red' ? 'bg-red-100 text-red-700' : scheduleStatus === 'yellow' ? 'bg-amber-100 text-amber-700' : scheduleStatus === 'green' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`,
                                                    children: [
                                                        scheduleStatus === 'red' && '⚠️ Job is ON HOLD',
                                                        scheduleStatus === 'yellow' && '⚠️ Behind schedule (>5 business days from baseline)',
                                                        scheduleStatus === 'green' && '✓ On schedule (within 5 business days of baseline)',
                                                        scheduleStatus === 'neutral' && 'Schedule status unavailable',
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "ml-4 text-slate-500",
                                                            children: [
                                                                "• ",
                                                                statusNotes.length,
                                                                " total record",
                                                                statusNotes.length !== 1 ? 's' : ''
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                            lineNumber: 990,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                                    lineNumber: 985,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                            lineNumber: 880,
                                            columnNumber: 358
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                                    lineNumber: 877,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                            lineNumber: 763,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                    lineNumber: 751,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
                lineNumber: 750,
                columnNumber: 36
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend2.4/app/(dashboard)/admin/manage-backlog/page.tsx",
        lineNumber: 653,
        columnNumber: 10
    }, this);
}
_s(ManageBacklogPage, "uecXP9MZgKeT+kaqgyy3NJvEjQ4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend2$2e$4$2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"]
    ];
});
_c = ManageBacklogPage;
var _c;
__turbopack_context__.k.register(_c, "ManageBacklogPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend2_4_app_%28dashboard%29_admin_manage-backlog_page_tsx_38a07374._.js.map