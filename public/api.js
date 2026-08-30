async function api(path, options) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "content-type": "application/json" },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = "/login.html";
    throw new Error("Not authenticated");
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new Error((body && body.error) || `Request failed (${res.status})`);
  return body;
}

const Api = {
  bootstrap: () => api("/bootstrap"),
  me: () => api("/auth/me"),
  logout: () => api("/auth/logout", { method: "POST" }),

  createTransaction: (payload) => api("/transactions", { method: "POST", body: JSON.stringify(payload) }),
  deleteTransaction: (id) => api(`/transactions/${id}`, { method: "DELETE" }),

  saveBudget: (payload) => api("/budget", { method: "PUT", body: JSON.stringify(payload) }),

  createGoal: (payload) => api("/goals", { method: "POST", body: JSON.stringify(payload) }),
  updateGoal: (id, payload) => api(`/goals/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  contributeGoal: (id, amount) => api(`/goals/${id}/contribute`, { method: "POST", body: JSON.stringify({ amount }) }),
  deleteGoal: (id) => api(`/goals/${id}`, { method: "DELETE" }),

  createSharedGroup: (payload) => api("/shared", { method: "POST", body: JSON.stringify(payload) }),
  settleSharedGroup: (id) => api(`/shared/${id}/settle`, { method: "POST" }),

  patchNotifications: (payload) => api("/notifications", { method: "PATCH", body: JSON.stringify(payload) }),

  aaStatus: () => api("/integrations/aa/status"),
  aaConnect: () => api("/integrations/aa/connect", { method: "POST" }),
  aaSync: () => api("/integrations/aa/sync", { method: "POST" }),
  aaDisconnect: () => api("/integrations/aa/disconnect", { method: "POST" }),

  gmailStatus: () => api("/integrations/gmail/status"),
  gmailConnect: () => api("/integrations/gmail/connect"),
  gmailSync: () => api("/integrations/gmail/sync", { method: "POST" }),
  gmailDisconnect: () => api("/integrations/gmail/disconnect", { method: "POST" }),
};
