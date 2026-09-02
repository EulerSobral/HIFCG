const API_BASE_URL = "http://localhost:8080";

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 3000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// AUTH
export async function loginApi(email: string, senha: string) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend de autenticação offline ou erro de conexão, fallback local:", err);
  }
  return null;
}

// DOCENTES
export async function fetchDocentesApi() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/docentes`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function addDocenteApi(d: any) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/docentes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removeDocenteApi(matricula: string) {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/api/docentes/${matricula}`, { method: "DELETE" });
  } catch {}
}

// AMBIENTES
export async function fetchAmbientesApi() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/ambientes`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function addAmbienteApi(a: any) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/ambientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(a),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removeAmbienteApi(codigo: string) {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/api/ambientes/${codigo}`, { method: "DELETE" });
  } catch {}
}

// CURSOS
export async function fetchCursosApi() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/cursos`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function addCursoApi(c: any) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/cursos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removeCursoApi(codigo: string) {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/api/cursos/${codigo}`, { method: "DELETE" });
  } catch {}
}

// DISCIPLINAS
export async function fetchDisciplinasApi() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/disciplinas`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function addDisciplinaApi(d: any) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/disciplinas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removeDisciplinaApi(codigo: string) {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/api/disciplinas/${codigo}`, { method: "DELETE" });
  } catch {}
}

// PERIODOS
export async function fetchPeriodosApi() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/periodos`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function addPeriodoApi(p: any) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/periodos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removePeriodoApi(codigo: string) {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/api/periodos/${codigo}`, { method: "DELETE" });
  } catch {}
}

// COORDENADORES
export async function fetchCoordenadoresApi() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/coordenadores`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function addCoordenadorApi(c: any) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/coordenadores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removeCoordenadorApi(matricula: string) {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/api/coordenadores/${matricula}`, { method: "DELETE" });
  } catch {}
}

// LOGS
export async function fetchLogsApi() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/logs`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function addLogApi(log: { usuarioMatricula?: string; acao: string; detalhes: string }) {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
  } catch {}
}
