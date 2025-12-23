(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/(dashboard)/users/UserTable.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
'use client';
;
;
const filtered = users.filter((u)=>u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
const sorted = [
    ...filtered
].sort((a, b)=>{
    const valA = a[sortKey];
    const valB = b[sortKey];
    return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
});
const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
function UserTable(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(7);
    if ($[0] !== "9dd3d99ff7f7614d3f72fa0e0797458f9be4ff6c94b897977cfffcc88e6f834a") {
        for(let $i = 0; $i < 7; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "9dd3d99ff7f7614d3f72fa0e0797458f9be4ff6c94b897977cfffcc88e6f834a";
    }
    const { onView, onEdit } = t0;
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
            className: "bg-slate-100",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                        className: "px-4 py-2",
                        children: "Name"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                        lineNumber: 37,
                        columnNumber: 46
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                        className: "px-4 py-2",
                        children: "Email"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                        lineNumber: 37,
                        columnNumber: 81
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                        className: "px-4 py-2",
                        children: "Role"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                        lineNumber: 37,
                        columnNumber: 117
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                        className: "px-4 py-2",
                        children: "Actions"
                    }, void 0, false, {
                        fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                        lineNumber: 37,
                        columnNumber: 152
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                lineNumber: 37,
                columnNumber: 42
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
            lineNumber: 37,
            columnNumber: 10
        }, this);
        $[1] = t1;
    } else {
        t1 = $[1];
    }
    let t2;
    if ($[2] !== onEdit || $[3] !== onView) {
        t2 = paginated.map({
            "UserTable[paginated.map()]": (user)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                    className: "border-t",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "px-4 py-2",
                            children: user.name
                        }, void 0, false, {
                            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                            lineNumber: 45,
                            columnNumber: 84
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "px-4 py-2",
                            children: user.email
                        }, void 0, false, {
                            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                            lineNumber: 45,
                            columnNumber: 126
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "px-4 py-2",
                            children: user.role
                        }, void 0, false, {
                            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                            lineNumber: 45,
                            columnNumber: 169
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "px-4 py-2 space-x-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: {
                                        "UserTable[paginated.map() > <button>.onClick]": ()=>onView(user)
                                    }["UserTable[paginated.map() > <button>.onClick]"],
                                    className: "text-blue-600 hover:underline",
                                    children: "View"
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                                    lineNumber: 45,
                                    columnNumber: 247
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: {
                                        "UserTable[paginated.map() > <button>.onClick]": ()=>onEdit(user)
                                    }["UserTable[paginated.map() > <button>.onClick]"],
                                    className: "text-green-600 hover:underline",
                                    children: "Edit"
                                }, void 0, false, {
                                    fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                                    lineNumber: 47,
                                    columnNumber: 118
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                            lineNumber: 45,
                            columnNumber: 211
                        }, this)
                    ]
                }, user.id, true, {
                    fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                    lineNumber: 45,
                    columnNumber: 45
                }, this)
        }["UserTable[paginated.map()]"]);
        $[2] = onEdit;
        $[3] = onView;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== t2) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "w-full border rounded overflow-hidden",
            children: [
                t1,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: t2
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                    lineNumber: 59,
                    columnNumber: 71
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
            lineNumber: 59,
            columnNumber: 10
        }, this);
        $[5] = t2;
        $[6] = t3;
    } else {
        t3 = $[6];
    }
    return t3;
}
_c = UserTable;
var _c;
__turbopack_context__.k.register(_c, "UserTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/(dashboard)/users/UserView.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
;
;
function UserView(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(14);
    if ($[0] !== "9ec4e4eb08b66b8c2ac16d3b02b2373d0a64a6b540f3ed72e7c07ac38e990d54") {
        for(let $i = 0; $i < 14; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "9ec4e4eb08b66b8c2ac16d3b02b2373d0a64a6b540f3ed72e7c07ac38e990d54";
    }
    const { user, onClose } = t0;
    let t1;
    if ($[1] !== user.name) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
            className: "text-xl font-bold mb-2",
            children: [
                "Viewing ",
                user.name
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserView.tsx",
            lineNumber: 16,
            columnNumber: 10
        }, this);
        $[1] = user.name;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== user.email) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            children: [
                "Email: ",
                user.email
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserView.tsx",
            lineNumber: 24,
            columnNumber: 10
        }, this);
        $[3] = user.email;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== user.role) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            children: [
                "Role: ",
                user.role
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserView.tsx",
            lineNumber: 32,
            columnNumber: 10
        }, this);
        $[5] = user.role;
        $[6] = t3;
    } else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== onClose) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onClose,
            className: "mt-4 text-red-600 hover:underline",
            children: "Close"
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserView.tsx",
            lineNumber: 40,
            columnNumber: 10
        }, this);
        $[7] = onClose;
        $[8] = t4;
    } else {
        t4 = $[8];
    }
    let t5;
    if ($[9] !== t1 || $[10] !== t2 || $[11] !== t3 || $[12] !== t4) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6",
            children: [
                t1,
                t2,
                t3,
                t4
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserView.tsx",
            lineNumber: 48,
            columnNumber: 10
        }, this);
        $[9] = t1;
        $[10] = t2;
        $[11] = t3;
        $[12] = t4;
        $[13] = t5;
    } else {
        t5 = $[13];
    }
    return t5;
}
_c = UserView;
var _c;
__turbopack_context__.k.register(_c, "UserView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/(dashboard)/users/UserEdit.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserEdit
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
;
;
function UserEdit(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(22);
    if ($[0] !== "9efbc962cc719e2dcd83a4cc99cdb1732f081171faed647ac93cd134fffaed6e") {
        for(let $i = 0; $i < 22; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "9efbc962cc719e2dcd83a4cc99cdb1732f081171faed647ac93cd134fffaed6e";
    }
    const { user, onClose } = t0;
    let t1;
    if ($[1] !== user.name) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
            className: "text-xl font-bold mb-2",
            children: [
                "Editing ",
                user.name
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserEdit.tsx",
            lineNumber: 16,
            columnNumber: 10
        }, this);
        $[1] = user.name;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== user.name) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            defaultValue: user.name,
            className: "border px-3 py-2 rounded w-full"
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserEdit.tsx",
            lineNumber: 24,
            columnNumber: 10
        }, this);
        $[3] = user.name;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== user.email) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            defaultValue: user.email,
            className: "border px-3 py-2 rounded w-full"
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserEdit.tsx",
            lineNumber: 32,
            columnNumber: 10
        }, this);
        $[5] = user.email;
        $[6] = t3;
    } else {
        t3 = $[6];
    }
    let t4;
    let t5;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
            value: "admin",
            children: "Admin"
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserEdit.tsx",
            lineNumber: 41,
            columnNumber: 10
        }, this);
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
            value: "user",
            children: "User"
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserEdit.tsx",
            lineNumber: 42,
            columnNumber: 10
        }, this);
        $[7] = t4;
        $[8] = t5;
    } else {
        t4 = $[7];
        t5 = $[8];
    }
    let t6;
    if ($[9] !== user.role) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
            defaultValue: user.role,
            className: "border px-3 py-2 rounded w-full",
            children: [
                t4,
                t5
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserEdit.tsx",
            lineNumber: 51,
            columnNumber: 10
        }, this);
        $[9] = user.role;
        $[10] = t6;
    } else {
        t6 = $[10];
    }
    let t7;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "submit",
            className: "bg-blue-600 text-white px-4 py-2 rounded",
            children: "Save"
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserEdit.tsx",
            lineNumber: 59,
            columnNumber: 10
        }, this);
        $[11] = t7;
    } else {
        t7 = $[11];
    }
    let t8;
    if ($[12] !== t2 || $[13] !== t3 || $[14] !== t6) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
            className: "space-y-4",
            children: [
                t2,
                t3,
                t6,
                t7
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserEdit.tsx",
            lineNumber: 66,
            columnNumber: 10
        }, this);
        $[12] = t2;
        $[13] = t3;
        $[14] = t6;
        $[15] = t8;
    } else {
        t8 = $[15];
    }
    let t9;
    if ($[16] !== onClose) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onClose,
            className: "mt-4 text-red-600 hover:underline",
            children: "Close"
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserEdit.tsx",
            lineNumber: 76,
            columnNumber: 10
        }, this);
        $[16] = onClose;
        $[17] = t9;
    } else {
        t9 = $[17];
    }
    let t10;
    if ($[18] !== t1 || $[19] !== t8 || $[20] !== t9) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6",
            children: [
                t1,
                t8,
                t9
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserEdit.tsx",
            lineNumber: 84,
            columnNumber: 11
        }, this);
        $[18] = t1;
        $[19] = t8;
        $[20] = t9;
        $[21] = t10;
    } else {
        t10 = $[21];
    }
    return t10;
}
_c = UserEdit;
var _c;
__turbopack_context__.k.register(_c, "UserEdit");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/(dashboard)/users/UserTabs.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserTabs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$dashboard$292f$users$2f$UserTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/(dashboard)/users/UserTable.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$dashboard$292f$users$2f$UserView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/(dashboard)/users/UserView.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$dashboard$292f$users$2f$UserEdit$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/(dashboard)/users/UserEdit.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function UserTabs(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(13);
    if ($[0] !== "f74fead16e7a518e9aa73a1b85cec37483e96811569639d6c49296cde610b2d3") {
        for(let $i = 0; $i < 13; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "f74fead16e7a518e9aa73a1b85cec37483e96811569639d6c49296cde610b2d3";
    }
    const { users } = t0;
    const [viewUser, setViewUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editUser, setEditUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    let t1;
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = ({
            "UserTabs[<UserTable>.onView]": (user)=>setViewUser(user)
        })["UserTabs[<UserTable>.onView]"];
        t2 = ({
            "UserTabs[<UserTable>.onEdit]": (user_0)=>setEditUser(user_0)
        })["UserTabs[<UserTable>.onEdit]"];
        $[1] = t1;
        $[2] = t2;
    } else {
        t1 = $[1];
        t2 = $[2];
    }
    let t3;
    if ($[3] !== users) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$dashboard$292f$users$2f$UserTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            users: users,
            onView: t1,
            onEdit: t2
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserTabs.tsx",
            lineNumber: 38,
            columnNumber: 10
        }, this);
        $[3] = users;
        $[4] = t3;
    } else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== viewUser) {
        t4 = viewUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-0 left-0 w-full h-full bg-white shadow-lg z-10",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$dashboard$292f$users$2f$UserView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                user: viewUser,
                onClose: {
                    "UserTabs[<UserView>.onClose]": ()=>setViewUser(null)
                }["UserTabs[<UserView>.onClose]"]
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/UserTabs.tsx",
                lineNumber: 46,
                columnNumber: 99
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserTabs.tsx",
            lineNumber: 46,
            columnNumber: 22
        }, this);
        $[5] = viewUser;
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== editUser) {
        t5 = editUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed top-0 right-0 w-1/2 h-full bg-white shadow-lg z-20",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f28$dashboard$292f$users$2f$UserEdit$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                user: editUser,
                onClose: {
                    "UserTabs[<UserEdit>.onClose]": ()=>setEditUser(null)
                }["UserTabs[<UserEdit>.onClose]"]
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/UserTabs.tsx",
                lineNumber: 56,
                columnNumber: 96
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserTabs.tsx",
            lineNumber: 56,
            columnNumber: 22
        }, this);
        $[7] = editUser;
        $[8] = t5;
    } else {
        t5 = $[8];
    }
    let t6;
    if ($[9] !== t3 || $[10] !== t4 || $[11] !== t5) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t3,
                t4,
                t5
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserTabs.tsx",
            lineNumber: 66,
            columnNumber: 10
        }, this);
        $[9] = t3;
        $[10] = t4;
        $[11] = t5;
        $[12] = t6;
    } else {
        t6 = $[12];
    }
    return t6;
}
_s(UserTabs, "ytXGmo5MdNYc+ZRXlsjY/s1GRIA=");
_c = UserTabs;
var _c;
__turbopack_context__.k.register(_c, "UserTabs");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_%28dashboard%29_users_496fd54b._.js.map