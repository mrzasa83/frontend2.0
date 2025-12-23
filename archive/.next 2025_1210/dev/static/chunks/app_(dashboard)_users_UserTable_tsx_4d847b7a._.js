(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/(dashboard)/users/UserTable.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function UserTable(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(53);
    if ($[0] !== "fb2d6748bccec1e3eb3aa2e80151fb5e0099f9925130d7f07d7e512baaa77a1c") {
        for(let $i = 0; $i < 53; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "fb2d6748bccec1e3eb3aa2e80151fb5e0099f9925130d7f07d7e512baaa77a1c";
    }
    const { users } = t0;
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [sortKey, setSortKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("name");
    const [sortAsc, setSortAsc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [pageSize, setPageSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(10);
    const [page, setPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    let filtered;
    let paginated;
    let t1;
    let t2;
    let t3;
    let t4;
    let totalPages;
    if ($[1] !== page || $[2] !== pageSize || $[3] !== search || $[4] !== sortAsc || $[5] !== sortKey || $[6] !== users) {
        let t5;
        if ($[14] !== search) {
            t5 = ({
                "UserTable[users.filter()]": (u)=>u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
            })["UserTable[users.filter()]"];
            $[14] = search;
            $[15] = t5;
        } else {
            t5 = $[15];
        }
        filtered = users.filter(t5);
        let t6;
        if ($[16] !== sortAsc || $[17] !== sortKey) {
            t6 = ({
                "UserTable[(anonymous)()]": (a, b)=>{
                    const valA = a[sortKey];
                    const valB = b[sortKey];
                    return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
                }
            })["UserTable[(anonymous)()]"];
            $[16] = sortAsc;
            $[17] = sortKey;
            $[18] = t6;
        } else {
            t6 = $[18];
        }
        const sorted = [
            ...filtered
        ].sort(t6);
        paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
        totalPages = Math.ceil(filtered.length / pageSize);
        let t7;
        if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
            t7 = ({
                "UserTable[<input>.onChange]": (e)=>setSearch(e.target.value)
            })["UserTable[<input>.onChange]"];
            $[19] = t7;
        } else {
            t7 = $[19];
        }
        let t8;
        if ($[20] !== search) {
            t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                placeholder: "Search users...",
                value: search,
                onChange: t7,
                className: "border px-3 py-2 rounded w-1/3"
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                lineNumber: 78,
                columnNumber: 12
            }, this);
            $[20] = search;
            $[21] = t8;
        } else {
            t8 = $[21];
        }
        let t9;
        if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
            t9 = ({
                "UserTable[<select>.onChange]": (e_0)=>{
                    setPageSize(Number(e_0.target.value));
                    setPage(0);
                }
            })["UserTable[<select>.onChange]"];
            $[22] = t9;
        } else {
            t9 = $[22];
        }
        let t10;
        if ($[23] === Symbol.for("react.memo_cache_sentinel")) {
            t10 = [
                10,
                20,
                50,
                100
            ].map(_UserTableAnonymous);
            $[23] = t10;
        } else {
            t10 = $[23];
        }
        let t11;
        if ($[24] !== pageSize) {
            t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                value: pageSize,
                onChange: t9,
                className: "border px-2 py-1 rounded",
                children: t10
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                lineNumber: 105,
                columnNumber: 13
            }, this);
            $[24] = pageSize;
            $[25] = t11;
        } else {
            t11 = $[25];
        }
        if ($[26] !== t11 || $[27] !== t8) {
            t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-4",
                children: [
                    t8,
                    t11
                ]
            }, void 0, true, {
                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                lineNumber: 112,
                columnNumber: 12
            }, this);
            $[26] = t11;
            $[27] = t8;
            $[28] = t4;
        } else {
            t4 = $[28];
        }
        t2 = "w-full border rounded overflow-hidden";
        if ($[29] !== sortAsc || $[30] !== sortKey) {
            t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                className: "bg-slate-100",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                    children: [
                        "name",
                        "phone",
                        "nickname",
                        "email",
                        "role"
                    ].map({
                        "UserTable[(anonymous)()]": (key)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-left px-4 py-2 cursor-pointer",
                                onClick: {
                                    "UserTable[(anonymous)() > <th>.onClick]": ()=>key === sortKey ? setSortAsc(!sortAsc) : setSortKey(key)
                                }["UserTable[(anonymous)() > <th>.onClick]"],
                                children: [
                                    key.charAt(0).toUpperCase() + key.slice(1),
                                    sortKey === key && (sortAsc ? " \u25B2" : " \u25BC")
                                ]
                            }, key, true, {
                                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                                lineNumber: 122,
                                columnNumber: 48
                            }, this)
                    }["UserTable[(anonymous)()]"])
                }, void 0, false, {
                    fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                    lineNumber: 121,
                    columnNumber: 44
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                lineNumber: 121,
                columnNumber: 12
            }, this);
            $[29] = sortAsc;
            $[30] = sortKey;
            $[31] = t3;
        } else {
            t3 = $[31];
        }
        t1 = paginated.map(_UserTablePaginatedMap);
        $[1] = page;
        $[2] = pageSize;
        $[3] = search;
        $[4] = sortAsc;
        $[5] = sortKey;
        $[6] = users;
        $[7] = filtered;
        $[8] = paginated;
        $[9] = t1;
        $[10] = t2;
        $[11] = t3;
        $[12] = t4;
        $[13] = totalPages;
    } else {
        filtered = $[7];
        paginated = $[8];
        t1 = $[9];
        t2 = $[10];
        t3 = $[11];
        t4 = $[12];
        totalPages = $[13];
    }
    let t5;
    if ($[32] !== t1) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
            children: t1
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
            lineNumber: 157,
            columnNumber: 10
        }, this);
        $[32] = t1;
        $[33] = t5;
    } else {
        t5 = $[33];
    }
    let t6;
    if ($[34] !== t2 || $[35] !== t3 || $[36] !== t5) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: t2,
            children: [
                t3,
                t5
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
            lineNumber: 165,
            columnNumber: 10
        }, this);
        $[34] = t2;
        $[35] = t3;
        $[36] = t5;
        $[37] = t6;
    } else {
        t6 = $[37];
    }
    let t7;
    if ($[38] !== filtered.length || $[39] !== paginated.length) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-sm text-slate-500",
            children: [
                "Showing ",
                paginated.length,
                " of ",
                filtered.length,
                " users"
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
            lineNumber: 175,
            columnNumber: 10
        }, this);
        $[38] = filtered.length;
        $[39] = paginated.length;
        $[40] = t7;
    } else {
        t7 = $[40];
    }
    let t8;
    if ($[41] !== totalPages) {
        t8 = Array.from({
            length: totalPages
        });
        $[41] = totalPages;
        $[42] = t8;
    } else {
        t8 = $[42];
    }
    let t9;
    if ($[43] !== page || $[44] !== t8) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-x-2",
            children: t8.map({
                "UserTable[(anonymous)()]": (_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: {
                            "UserTable[(anonymous)() > <button>.onClick]": ()=>setPage(i)
                        }["UserTable[(anonymous)() > <button>.onClick]"],
                        className: `px-2 py-1 rounded ${i === page ? "bg-slate-800 text-white" : "bg-slate-200"}`,
                        children: i + 1
                    }, i, false, {
                        fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                        lineNumber: 195,
                        columnNumber: 47
                    }, this)
            }["UserTable[(anonymous)()]"])
        }, void 0, false, {
            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
            lineNumber: 194,
            columnNumber: 10
        }, this);
        $[43] = page;
        $[44] = t8;
        $[45] = t9;
    } else {
        t9 = $[45];
    }
    let t10;
    if ($[46] !== t7 || $[47] !== t9) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-between items-center mt-4",
            children: [
                t7,
                t9
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
            lineNumber: 207,
            columnNumber: 11
        }, this);
        $[46] = t7;
        $[47] = t9;
        $[48] = t10;
    } else {
        t10 = $[48];
    }
    let t11;
    if ($[49] !== t10 || $[50] !== t4 || $[51] !== t6) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t4,
                t6,
                t10
            ]
        }, void 0, true, {
            fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
            lineNumber: 216,
            columnNumber: 11
        }, this);
        $[49] = t10;
        $[50] = t4;
        $[51] = t6;
        $[52] = t11;
    } else {
        t11 = $[52];
    }
    return t11;
}
_s(UserTable, "gGax13e4TpytyJe8oN/wbRmLJ34=");
_c = UserTable;
function _UserTablePaginatedMap(user) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
        className: "border-t",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "px-4 py-2",
                children: user.name
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                lineNumber: 227,
                columnNumber: 49
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "px-4 py-2",
                children: user.mobile
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                lineNumber: 227,
                columnNumber: 91
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "px-4 py-2",
                children: user.nickname
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                lineNumber: 227,
                columnNumber: 135
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "px-4 py-2",
                children: user.email
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                lineNumber: 227,
                columnNumber: 181
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "px-4 py-2",
                children: user.role
            }, void 0, false, {
                fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
                lineNumber: 227,
                columnNumber: 224
            }, this)
        ]
    }, user.id, true, {
        fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
        lineNumber: 227,
        columnNumber: 10
    }, this);
}
function _UserTableAnonymous(size) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
        value: size,
        children: [
            "Show ",
            size
        ]
    }, size, true, {
        fileName: "[project]/app/(dashboard)/users/UserTable.tsx",
        lineNumber: 230,
        columnNumber: 10
    }, this);
}
var _c;
__turbopack_context__.k.register(_c, "UserTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_%28dashboard%29_users_UserTable_tsx_4d847b7a._.js.map