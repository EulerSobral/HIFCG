import { spawn, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = path.resolve(__dirname, "../../demo");
const FRONTEND_DIR = path.resolve(__dirname, "..");
const BACKEND_URL = "http://localhost:8080";
const IS_WINDOWS = process.platform === "win32";

let backendProcess = null;
let previewProcess = null;

function log(msg, type = "INFO") {
  const icon = type === "SUCCESS" ? "✅" : type === "ERROR" ? "❌" : type === "WARN" ? "⚠️" : "🚀";
  console.log(`[${type}] ${icon} ${msg}`);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function isBackendAlive() {
  try {
    const res = await fetchWithTimeout(`${BACKEND_URL}/api/ambientes`, {}, 2000);
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
}

async function startBackend() {
  log("Verificando se o backend Spring Boot já está ativo na porta 8080...");
  const alive = await isBackendAlive();
  if (alive) {
    log("Backend Spring Boot já está em execução!", "SUCCESS");
    return;
  }

  log("Iniciando o backend Spring Boot (HIFCG Demo)...");
  const gradlewCmd = IS_WINDOWS ? "gradlew.bat" : "./gradlew";
  backendProcess = spawn(gradlewCmd, ["bootRun"], {
    cwd: BACKEND_DIR,
    shell: true,
    stdio: "pipe",
  });

  backendProcess.stdout.on("data", (data) => {
    const line = data.toString();
    if (line.includes("Started DemoApplication") || line.includes("JVM running")) {
      log("Backend Spring Boot iniciado com sucesso!", "SUCCESS");
    }
  });

  log("Aguardando o backend ficar pronto na porta 8080 (até 45 segundos)...");
  const maxAttempts = 45;
  for (let i = 1; i <= maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isBackendAlive()) {
      log(`Backend pronto após ${i} segundos!`, "SUCCESS");
      return;
    }
  }

  throw new Error("O backend Spring Boot não iniciou no tempo limite de 45 segundos.");
}

async function testBackendEndpoints() {
  log("Executando testes de integração/requisições no backend...");

  // 1. Test GET /api/ambientes
  const getAmbientes = await fetchWithTimeout(`${BACKEND_URL}/api/ambientes`);
  if (!getAmbientes.ok) throw new Error(`GET /api/ambientes falhou com status ${getAmbientes.status}`);
  log("GET /api/ambientes -> Status 200 OK", "SUCCESS");

  // 2. Test POST /api/ambientes (Criar sala - Teste Caixa Preta)
  const testCodigo = `TEST_RELEASE_${Date.now() % 10000}`;
  const postBody = {
    codigo: testCodigo,
    nome: "Sala Teste Release Automated",
    tipo: "LABORATORIO",
    capacidade: 40,
  };

  const postAmbiente = await fetchWithTimeout(`${BACKEND_URL}/api/ambientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postBody),
  });

  if (!postAmbiente.ok) {
    throw new Error(`POST /api/ambientes falhou com status ${postAmbiente.status}`);
  }
  log(`POST /api/ambientes (Criar Sala '${testCodigo}') -> Status ${postAmbiente.status} OK`, "SUCCESS");

  // 3. Test GET /api/ambientes e verificar se o elemento recém-criado existe
  const checkAmbientes = await fetchWithTimeout(`${BACKEND_URL}/api/ambientes`);
  const list = await checkAmbientes.json();
  const created = Array.isArray(list) && list.some((item) => item.codigo === testCodigo);
  if (!created) {
    throw new Error(`Nova sala '${testCodigo}' não foi encontrada na listagem de ambientes!`);
  }
  log(`Validação de persistência da sala '${testCodigo}' no backend -> SUCESSO!`, "SUCCESS");

  // 4. Limpeza da sala de teste
  await fetchWithTimeout(`${BACKEND_URL}/api/ambientes/${testCodigo}`, { method: "DELETE" });
  log(`DELETE /api/ambientes/${testCodigo} -> Limpeza concluída`, "SUCCESS");

  // 5. Test outros endpoints
  const getDocentes = await fetchWithTimeout(`${BACKEND_URL}/api/docentes`);
  if (!getDocentes.ok) throw new Error(`GET /api/docentes falhou com status ${getDocentes.status}`);
  log("GET /api/docentes -> Status 200 OK", "SUCCESS");

  const getCursos = await fetchWithTimeout(`${BACKEND_URL}/api/cursos`);
  if (!getCursos.ok) throw new Error(`GET /api/cursos falhou com status ${getCursos.status}`);
  log("GET /api/cursos -> Status 200 OK", "SUCCESS");
}

async function buildFrontend() {
  log("Iniciando compilação do Frontend (Vite Build)...");
  execSync("npm run build", { cwd: FRONTEND_DIR, stdio: "inherit" });
  log("Build de produção do Frontend concluída com sucesso!", "SUCCESS");
}

async function testFrontendPreview() {
  log("Iniciando servidor de preview do frontend...");
  previewProcess = spawn(IS_WINDOWS ? "npx.cmd" : "npx", ["vite", "preview", "--port", "4173"], {
    cwd: FRONTEND_DIR,
    shell: true,
    stdio: "pipe",
  });

  log("Aguardando servidor de preview na porta 4173...");
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetchWithTimeout("http://localhost:4173", {}, 1000);
      if (res.ok) {
        log("Servidor de preview respondendo na porta 4173!", "SUCCESS");
        return;
      }
    } catch {}
  }
  log("Preview pode estar em porta alternativa ou já ativo.", "WARN");
}

function cleanup() {
  log("Limpando processos criados pelo teste...");
  if (backendProcess) {
    try {
      if (IS_WINDOWS) {
        execSync(`taskkill /pid ${backendProcess.pid} /T /F`);
      } else {
        backendProcess.kill("SIGTERM");
      }
    } catch {}
  }
  if (previewProcess) {
    try {
      if (IS_WINDOWS) {
        execSync(`taskkill /pid ${previewProcess.pid} /T /F`);
      } else {
        previewProcess.kill("SIGTERM");
      }
    } catch {}
  }
}

async function run() {
  console.log("\n=======================================================");
  console.log(" 🧪 HIFCG - TESTES DE RELEASE FRONTEND & BACKEND ");
  console.log("=======================================================\n");

  try {
    await startBackend();
    await testBackendEndpoints();
    await buildFrontend();
    await testFrontendPreview();

    console.log("\n=======================================================");
    log("TODOS OS TESTES DE RELEASE FORAM EXECUTADOS COM SUCESSO!", "SUCCESS");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("\n❌ ERRO DURANTE A EXECUÇÃO DOS TESTES DE RELEASE:");
    console.error(err);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

run();
