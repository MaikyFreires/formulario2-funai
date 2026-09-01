const APP_CONFIG = window.APP_CONFIG || {};
const FORMULARIO2_CONFIG = window.FORMULARIO2_CONFIG || {};
const FORMULARIO2_ENDPOINTS = {
  receber: FORMULARIO2_CONFIG.receberFormulario || "",
  enviados: FORMULARIO2_CONFIG.listarEnviados || "",
  rascunhos: FORMULARIO2_CONFIG.listarRascunhos || "",
  carregarRascunho: FORMULARIO2_CONFIG.carregarRascunho || ""
};
const FORMULARIO2_ROUTES = {
  receber: "receber",
  enviados: "enviados",
  rascunhos: "rascunhos",
  carregarRascunho: "carregarRascunho"
};
const VERIFY_ACCESS_URL = APP_CONFIG.VERIFY_ACCESS_URL || "";
const SECRET_TOKEN = "FUNAI_FORM_SECRET_2026";
const AUTHORIZED_EMAIL_KEY = "consultorEmailAutorizado";
const ACCESS_SESSION_KEY = "consultorSessaoAtiva";
const ACTIVE_FORM_ID_KEY = "formularioIdAtivo";
const SENT_FORM_IDS_KEY = "formulariosEnviadosSemRascunho";
const MUNICIPIOS_CSV_URL = "data/municipios-estados.csv";
const ETNIAS_CSV_URL = "data/Etnias%20IBGE%20.csv";
const APP_VERSION = "20260804-01";
const AUTOSAVE_DEBOUNCE_MS = 2000;
const AUTOSAVE_MIN_INTERVAL_MS = 5000;
const DATE_BR_FIELD_NAMES = new Set([
  "dataDocumentoRegularizacao",
  "dataPrimeiraMencaoReivindicacao"
]);
const REQUIRED_FORMULARIO_JSON_BLOCKS = [
  "consultor",
  "reivindicacao",
  "caracterizacaoArea",
  "situacaoArea",
  "encaminhamentos"
];
const TIPOS_ACAO_JUDICIAL = ["Qualificação", "Constituição de GT", "Outros"];
const COMUNIDADES_TRADICIONAIS = [
  "Indígenas",
  "Quilombolas",
  "Povos de Terreiro",
  "Povos de Matriz Africana",
  "Ciganos",
  "Pescadores Artesanais",
  "Marisqueiras",
  "Ribeirinhos",
  "Caiçaras",
  "Extrativistas",
  "Extrativistas Costeiros e Marinhos",
  "Seringueiros",
  "Castanheiros",
  "Quebradeiras de Coco Babaçu",
  "Comunidades de Fundo e Fecho de Pasto",
  "Faxinalenses",
  "Pantaneiros",
  "Geraizeiros",
  "Veredeiros",
  "Caatingueiros",
  "Vazanteiros",
  "Retireiros do Araguaia",
  "Praieiros",
  "Jangadeiros",
  "Açorianos",
  "Campeiros",
  "Sertanejos",
  "Apanhadores de Flores Sempre-vivas",
  "Raizeiros",
  "Benzedeiras",
  "Pomeranos",
  "Ilhéus",
  "Caboclos",
  "Outros"
];
const HTML_PARTIALS = ["html/acesso.html", "html/dashboard.html", "html/formulario.html"];
let formApp;
let accessGate;
let accessForm;
let accessEmail;
let accessSubmitBtn;
let accessMessage;
let consultorDashboard;
let dashboardEmail;
let dashboardMessage;
let newReportBtn;
let draftReportsBtn;
let sentReportsBtn;
let reportListPanel;
let reportListTitle;
let reportListMessage;
let reportList;
let reportListControls;
let reportIdSearch;
let closeReportListBtn;
let form;
let steps = [];
let progressBar;
let progressTitle;
let stepCounter;
let prevBtn;
let nextBtn;
let submitBtn;
let saveDraftBtn;
let savePdfBtn;
let homeBtn;
let messageBox;
let formSizeMeter;
let autosaveStatus;
let descricaoReivindicacaoField;
let descricaoReivindicacaoCounter;
let etniaInput;
let etniaOptions;
let etniaChips;
let addEtniaBtn;
let outraEtniaInput;
let outraEtniaChips;
let addOutraEtniaBtn;
let aldeiasList;
let aldeiaInput;
let aldeiaChips;
let addAldeiaBtn;
let documentosTableBody;
let addDocumentoBtn;
let estadoInput;
let estadoOptions;
let estadoChips;
let addEstadoBtn;
let municipioInput;
let municipioOptions;
let municipioChips;
let addMunicipioBtn;
let coordenadasTableBody;
let mapasTableBody;
let comunidadeTradicionalInput;
let comunidadeTradicionalOptions;
let comunidadeTradicionalChips;
let addComunidadeTradicionalBtn;
let comunidadeTradicionalDetalhes;

let currentStep = 0;
let selectedEtnias = [];
let selectedOutrasEtnias = [];
let selectedEstados = [];
let selectedMunicipios = [];
let selectedComunidadesTradicionais = [];
let selectedAldeiasComunidades = [];
let municipiosPorEstado = new Map();
let allEstados = [];
let allEtnias = [];
let formInitialized = false;
let currentFormularioId = "";
let cachedReports = [];
let currentReportListMode = "draft";
let activeFormMode = "edit";
let activePersistenceMode = "create";
let autosaveTimer = null;
let autosaveEmAndamento = false;
let autosavePendente = false;
let autosavePromise = null;
let envioFinalEmAndamento = false;
let formulariosBloqueadosParaRascunho = new Set();
let ultimoAutosaveEm = 0;
let ultimaAssinaturaAutosave = "";

init();

// Bootstrap
async function init() {
  await loadHtmlPartials();
  cacheDomElements();
  bindAccessEvents();

  const authorizedEmail = getStoredAuthorizedEmail();
  if (hasActiveSession() && authorizedEmail) {
    showDashboard(authorizedEmail);
    return;
  }

  showAccessScreen();
}

async function loadHtmlPartials() {
  const appRoot = document.querySelector("#appRoot");
  const partials = await Promise.all(
    HTML_PARTIALS.map(async (path) => {
      const response = await fetch(withCacheBust(path));
      if (!response.ok) throw new Error(`Não foi possível carregar ${path}`);
      return response.text();
    })
  );

  appRoot.innerHTML = partials.join("\n");
}

function withCacheBust(path) {
  return `${path}?v=${APP_VERSION}`;
}

function cacheDomElements() {
  formApp = document.querySelector("#formApp");
  accessGate = document.querySelector("#accessGate");
  accessForm = document.querySelector("#accessForm");
  accessEmail = document.querySelector("#accessEmail");
  accessSubmitBtn = document.querySelector("#accessSubmitBtn");
  accessMessage = document.querySelector("#accessMessage");
  consultorDashboard = document.querySelector("#consultorDashboard");
  dashboardEmail = document.querySelector("#dashboardEmail");
  dashboardMessage = document.querySelector("#dashboardMessage");
  newReportBtn = document.querySelector("#newReportBtn");
  draftReportsBtn = document.querySelector("#draftReportsBtn");
  sentReportsBtn = document.querySelector("#sentReportsBtn");
  reportListPanel = document.querySelector("#reportListPanel");
  reportListTitle = document.querySelector("#reportListTitle");
  reportListMessage = document.querySelector("#reportListMessage");
  reportList = document.querySelector("#reportList");
  reportListControls = document.querySelector("#reportListControls");
  reportIdSearch = document.querySelector("#reportIdSearch");
  closeReportListBtn = document.querySelector("#closeReportListBtn");
  form = document.querySelector("#funaiForm");
  steps = Array.from(document.querySelectorAll(".step"));
  progressBar = document.querySelector("#progressBar");
  progressTitle = document.querySelector("#progressTitle");
  stepCounter = document.querySelector("#stepCounter");
  prevBtn = document.querySelector("#prevBtn");
  nextBtn = document.querySelector("#nextBtn");
  submitBtn = document.querySelector("#submitBtn");
  saveDraftBtn = document.querySelector("#saveDraftBtn");
  savePdfBtn = document.querySelector("#savePdfBtn");
  homeBtn = document.querySelector("#homeBtn");
  messageBox = document.querySelector("#formMessage");
  formSizeMeter = document.querySelector("#formSizeMeter");
  autosaveStatus = document.querySelector("#autosaveStatus");
  descricaoReivindicacaoField = form?.elements.descricaoReivindicacao;
  descricaoReivindicacaoCounter = document.querySelector("#descricaoReivindicacaoCounter");
  etniaInput = document.querySelector("#etniaInput");
  etniaOptions = document.querySelector("#etniaOptions");
  etniaChips = document.querySelector("#etniaChips");
  addEtniaBtn = document.querySelector("#addEtniaBtn");
  outraEtniaInput = document.querySelector("#outraEtniaInput");
  outraEtniaChips = document.querySelector("#outraEtniaChips");
  addOutraEtniaBtn = document.querySelector("#addOutraEtniaBtn");
  aldeiasList = document.querySelector("#aldeiasList");
  aldeiaInput = document.querySelector("#aldeiaInput");
  aldeiaChips = document.querySelector("#aldeiaChips");
  addAldeiaBtn = document.querySelector("#addAldeiaBtn");
  documentosTableBody = document.querySelector("#documentosTableBody");
  addDocumentoBtn = document.querySelector("#addDocumentoBtn");
  estadoInput = document.querySelector("#estadoInput");
  estadoOptions = document.querySelector("#estadoOptions");
  estadoChips = document.querySelector("#estadoChips");
  addEstadoBtn = document.querySelector("#addEstadoBtn");
  municipioInput = document.querySelector("#municipioInput");
  municipioOptions = document.querySelector("#municipioOptions");
  municipioChips = document.querySelector("#municipioChips");
  addMunicipioBtn = document.querySelector("#addMunicipioBtn");
  coordenadasTableBody = document.querySelector("#coordenadasTableBody");
  mapasTableBody = document.querySelector("#mapasTableBody");
  comunidadeTradicionalInput = document.querySelector("#comunidadeTradicionalInput");
  comunidadeTradicionalOptions = document.querySelector("#comunidadeTradicionalOptions");
  comunidadeTradicionalChips = document.querySelector("#comunidadeTradicionalChips");
  addComunidadeTradicionalBtn = document.querySelector("#addComunidadeTradicionalBtn");
  comunidadeTradicionalDetalhes = document.querySelector("#comunidadeTradicionalDetalhes");
}

function bindAccessEvents() {
  accessForm.addEventListener("submit", handleAccessSubmit);
  newReportBtn.addEventListener("click", novoRelatorio);
  draftReportsBtn.addEventListener("click", () => listarRascunhos());
  sentReportsBtn.addEventListener("click", () => listarEnviados());
  reportIdSearch?.addEventListener("input", handleSentReportSearch);
  closeReportListBtn.addEventListener("click", hideReportList);
}

async function handleAccessSubmit(event) {
  event.preventDefault();
  clearAccessMessage();

  const email = accessEmail.value.trim().toLowerCase();
  if (!accessEmail.checkValidity() || !email) {
    showAccessMessage("Informe um e-mail válido.", "error");
    accessEmail.classList.add("invalid");
    return;
  }

  if (!VERIFY_ACCESS_URL) {
    showAccessMessage("Configure VERIFY_ACCESS_URL no arquivo js/config.local.js.", "error");
    return;
  }

  accessEmail.classList.remove("invalid");
  accessSubmitBtn.disabled = true;
  accessSubmitBtn.textContent = "Verificando...";

  try {
    const response = await fetch(VERIFY_ACCESS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        consultor: {
          email
        }
      })
    });
    const data = await response.json();
    console.log(data);

    if (data.autorizado === true || data.success === true) {
      storeAuthorizedEmail(email);
      startAccessSession();
      showDashboard(email);
      return;
    }

    if (data.autorizado === false) {
      showAccessMessage("E-mail não autorizado.", "error");
      return;
    }

    showAccessMessage("Não foi possível confirmar a autorização do e-mail.", "error");
  } catch (error) {
    showAccessMessage("Não foi possível verificar o e-mail. Tente novamente.", "error");
  } finally {
    accessSubmitBtn.disabled = false;
    accessSubmitBtn.textContent = "Acessar formulário";
  }
}

function showDashboard(email = getAuthorizedEmail(), message = "") {
  if (!hasActiveSession()) {
    showAccessScreen();
    return;
  }

  activeFormMode = "dashboard";
  cancelarAutosavePendente();
  accessGate.hidden = true;
  consultorDashboard.hidden = false;
  formApp.hidden = true;
  dashboardEmail.textContent = email;
  hideReportList();
  showDashboardMessage(message, message ? "success" : "");
}

function showAccessScreen() {
  activeFormMode = "access";
  cancelarAutosavePendente();
  accessGate.hidden = false;
  consultorDashboard.hidden = true;
  formApp.hidden = true;
  currentFormularioId = "";
  sessionStorage.removeItem(ACTIVE_FORM_ID_KEY);
}

// Form lifecycle
async function initializeForm() {
  if (formInitialized) return;
  formInitialized = true;
  loadSentDraftBlockList();
  await loadEtniaData();
  await loadMunicipioData();
  populateComunidadeTradicionalOptions();
  bindEvents();
  updateConditionals();
  updateDescricaoReivindicacaoCounter();
  updateFormularioJsonSizeMeter();
  showStep(0);
}

async function novoRelatorio() {
  currentFormularioId = "";
  activePersistenceMode = "create";
  envioFinalEmAndamento = false;
  sessionStorage.removeItem(ACTIVE_FORM_ID_KEY);
  await openForm({ reset: true, mode: "edit" });
  currentFormularioId = createFormularioId();
  sessionStorage.setItem(ACTIVE_FORM_ID_KEY, currentFormularioId);
}

async function startNewReport() {
  return novoRelatorio();
}

async function openForm({ reset = false, mode = "edit" } = {}) {
  const email = getStoredAuthorizedEmail();
  if (!email || !hasActiveSession()) {
    showAccessScreen();
    return;
  }

  activeFormMode = mode;
  await initializeForm();
  if (reset) limparFormulario();
  setAuthorizedEmail(email);
  setFormViewMode(mode);
  accessGate.hidden = true;
  consultorDashboard.hidden = true;
  formApp.hidden = false;
  showStep(0);
}

function limparFormulario() {
  activePersistenceMode = "create";
  form.reset();
  selectedEtnias = [];
  selectedOutrasEtnias = [];
  selectedEstados = [];
  selectedMunicipios = [];
  selectedComunidadesTradicionais = [];
  selectedAldeiasComunidades = [];
  resetDocumentoRows();
  resetCoordenadaRows();
  resetMapaRows();
  carregarProcessosAnalisados();
  resetAldeiaFields();
  renderEtniaChips();
  renderOutraEtniaChips();
  renderEstadoChips();
  renderMunicipioChips();
  renderComunidadeTradicionalChips();
  renderAldeiaChips();
  renderComunidadeTradicionalDetalhes();
  renderAcoesJudiciaisDetalhadas([]);
  populateEstadoOptions();
  populateMunicipioOptions();
  populateComunidadeTradicionalOptions();
  clearMessage();
  clearValidationErrors();
  updateConditionals();
  updateDescricaoReivindicacaoCounter();
  updateFormularioJsonSizeMeter();
}

function setAuthorizedEmail(email) {
  const field = form.elements.consultorEmail;
  if (!field) return;

  field.value = email;
  field.readOnly = true;
}

function bindEvents() {
  form.addEventListener("beforeinput", handleNumericIdBeforeInput);
  form.addEventListener("input", handleFormChange);
  form.addEventListener("input", agendarAutosave);
  form.addEventListener("input", handleNumericIdInput);
  form.addEventListener("input", handleDateMaskInput);
  form.addEventListener("change", handleFormChange);
  form.addEventListener("change", agendarAutosave);
  form.addEventListener("focusout", agendarAutosave);
  form.addEventListener("click", handleAutosaveDynamicClick);
  form.addEventListener("click", handleConflictEthnicityClick);
  form.addEventListener("keydown", handleConflictEthnicityKeydown);
  form.addEventListener("submit", enviarFormulario);
  addEtniaBtn?.addEventListener("click", addSelectedEtnia);
  etniaInput?.addEventListener("keydown", handleEtniaKeydown);
  etniaChips?.addEventListener("click", removeSelectedEtnia);
  addOutraEtniaBtn?.addEventListener("click", addSelectedOutraEtnia);
  outraEtniaInput?.addEventListener("keydown", handleOutraEtniaKeydown);
  outraEtniaChips?.addEventListener("click", removeSelectedOutraEtnia);
  addEstadoBtn?.addEventListener("click", addSelectedEstado);
  estadoInput?.addEventListener("keydown", handleEstadoKeydown);
  estadoChips?.addEventListener("click", removeSelectedEstado);
  addMunicipioBtn?.addEventListener("click", addSelectedMunicipio);
  municipioInput?.addEventListener("keydown", handleMunicipioKeydown);
  municipioChips?.addEventListener("click", removeSelectedMunicipio);
  addComunidadeTradicionalBtn?.addEventListener("click", addSelectedComunidadeTradicional);
  comunidadeTradicionalInput?.addEventListener("keydown", handleComunidadeTradicionalKeydown);
  comunidadeTradicionalChips?.addEventListener("click", removeSelectedComunidadeTradicional);
  addAldeiaBtn?.addEventListener("click", () => addAldeiaField());
  aldeiaInput?.addEventListener("keydown", handleAldeiaKeydown);
  aldeiaChips?.addEventListener("click", removeAldeiaField);
  documentosTableBody?.addEventListener("click", handleDocumentoTableClick);
  document.addEventListener("click", handleInfoToggleClick);
  coordenadasTableBody?.addEventListener("click", handleCoordenadaTableClick);
  coordenadasTableBody?.addEventListener("input", handleCoordenadaTableInput);
  mapasTableBody?.addEventListener("click", handleMapaTableClick);
  prevBtn.addEventListener("click", goToPreviousStep);
  nextBtn.addEventListener("click", goToNextStep);
  saveDraftBtn.addEventListener("click", salvarRascunho);
  savePdfBtn.addEventListener("click", salvarPdf);
  homeBtn.addEventListener("click", confirmReturnHome);
}

function handleFormChange(event) {
  clearMessage();
  updateConditionals({ renderDynamic: isChoiceInput(event?.target) });
  clearResolvedValidationErrors();
  if (!event?.target || event.target === descricaoReivindicacaoField) updateDescricaoReivindicacaoCounter();
  updateFormularioJsonSizeMeter();
}

function updateDescricaoReivindicacaoCounter() {
  if (!descricaoReivindicacaoField || !descricaoReivindicacaoCounter) return;

  const usedCharacters = descricaoReivindicacaoField.value.length;
  descricaoReivindicacaoCounter.textContent = `${usedCharacters.toLocaleString("pt-BR")} caracteres`;
}

function handleAutosaveDynamicClick(event) {
  const button = event.target.closest("button");
  if (!button || !form.contains(button)) return;
  if (button.matches("#saveDraftBtn, #submitBtn, #nextBtn, #prevBtn, #homeBtn, #savePdfBtn")) return;
  agendarAutosave();
}

function agendarAutosave() {
  if (activeFormMode !== "edit") return;
  if (envioFinalEmAndamento || isCurrentFormularioBlockedForDraft()) return;
  if (!hasActiveFormularioId()) return;
  if (!getValue("reivindicacaoId")) {
    console.log("autosave ignorado: sem ReivindicacaoId");
    return;
  }
  if (!getAuthorizedEmail()) return;

  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(executarAutosave, AUTOSAVE_DEBOUNCE_MS);
  console.log("autosave agendado");
}

async function executarAutosave() {
  autosaveTimer = null;

  if (activeFormMode !== "edit") return;
  if (envioFinalEmAndamento) return;
  if (isCurrentFormularioBlockedForDraft()) return;
  if (!hasActiveFormularioId()) return;
  if (!getValue("reivindicacaoId")) {
    console.log("autosave ignorado: sem ReivindicacaoId");
    return;
  }
  if (!getAuthorizedEmail()) return;

  const esperaMinima = AUTOSAVE_MIN_INTERVAL_MS - (Date.now() - ultimoAutosaveEm);
  if (esperaMinima > 0) {
    autosaveTimer = window.setTimeout(executarAutosave, esperaMinima);
    return;
  }

  if (autosaveEmAndamento) {
    autosavePendente = true;
    return;
  }

  autosaveEmAndamento = true;
  setAutosaveStatus("Salvando...", "saving");
  console.log("autosave executado");

  try {
    autosavePromise = salvarFormulario("Rascunho", { automatico: true });
    const salvo = await autosavePromise;
    ultimoAutosaveEm = Date.now();
    if (salvo) {
      setAutosaveStatus(`Rascunho salvo automaticamente \u00e0s ${formatAutosaveTime(new Date())}`, "success");
    }
  } catch (error) {
    console.error("Erro no autosave", error);
    setAutosaveStatus("Erro ao salvar automaticamente", "error");
  } finally {
    autosavePromise = null;
    autosaveEmAndamento = false;
    if (autosavePendente && !envioFinalEmAndamento) {
      autosavePendente = false;
      agendarAutosave();
    }
  }
}

function cancelarAutosavePendente() {
  window.clearTimeout(autosaveTimer);
  autosaveTimer = null;
  autosavePendente = false;
}

function loadSentDraftBlockList() {
  try {
    const ids = JSON.parse(sessionStorage.getItem(SENT_FORM_IDS_KEY) || "[]");
    formulariosBloqueadosParaRascunho = new Set(Array.isArray(ids) ? ids.filter(Boolean) : []);
  } catch (error) {
    formulariosBloqueadosParaRascunho = new Set();
  }
}

function persistSentDraftBlockList() {
  sessionStorage.setItem(SENT_FORM_IDS_KEY, JSON.stringify(Array.from(formulariosBloqueadosParaRascunho)));
}

function blockDraftSavesForFormulario(formularioId = currentFormularioId || sessionStorage.getItem(ACTIVE_FORM_ID_KEY) || "") {
  const id = asText(formularioId);
  if (!id) return;

  formulariosBloqueadosParaRascunho.add(id);
  persistSentDraftBlockList();
}

function isCurrentFormularioBlockedForDraft() {
  const id = asText(currentFormularioId || sessionStorage.getItem(ACTIVE_FORM_ID_KEY));
  return Boolean(id && formulariosBloqueadosParaRascunho.has(id));
}

function hasActiveFormularioId() {
  return Boolean(asText(currentFormularioId || sessionStorage.getItem(ACTIVE_FORM_ID_KEY)));
}

function setAutosaveStatus(text, state = "") {
  if (!autosaveStatus) return;
  autosaveStatus.textContent = text;
  autosaveStatus.className = `autosave-status${state ? ` is-${state}` : ""}`;
}

function formatAutosaveTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function isChoiceInput(field) {
  return field?.matches?.('input[type="radio"], input[type="checkbox"], select') ?? false;
}

function isReivindicacaoIdField(field) {
  return field?.name === "reivindicacaoId";
}

function handleNumericIdBeforeInput(event) {
  if (!isReivindicacaoIdField(event.target)) return;
  if (!event.data) return;
  if (/\D/.test(event.data)) event.preventDefault();
}

function handleNumericIdInput(event) {
  const field = event.target;
  if (!isReivindicacaoIdField(field)) return;

  const numericValue = String(field.value || "").replace(/\D/g, "");
  if (field.value !== numericValue) field.value = numericValue;
}

function handleDateMaskInput(event) {
  const field = event.target;
  if (!field || field.tagName !== "INPUT" || field.type !== "text") return;
  if (!isBrazilianDateField(field)) return;

  field.value = formatDateInputValue(field.value);
  if (!field.value || isBrazilianDateCompleteAndValid(field.value)) clearControlError(field);
}

function isBrazilianDateField(field) {
  return Boolean(field) && (
    DATE_BR_FIELD_NAMES.has(field.name) ||
    field.matches?.("[data-date-field], [data-acao-data], [data-vulnerability-date], [data-community-date], [data-conflict-reference]")
  );
}

function formatDateInputValue(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isBrazilianDateCompleteAndValid(value) {
  const text = asText(value).trim();
  return /^\d{2}\/\d{2}\/\d{4}$/.test(text) && isDataValida(text);
}

function handleInfoToggleClick(event) {
  const button = event.target.closest(".info-icon");
  if (!button) return;

  const label = button.closest(".table-info-label");
  const text = label?.querySelector(".info-text");
  if (!text) return;

  const isVisible = text.classList.toggle("is-visible");
  button.setAttribute("aria-expanded", String(isVisible));
}

function showStep(index) {
  if (activeFormMode === "sent") {
    renderSentFullView();
    return;
  }

  currentStep = index;

  steps.forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === currentStep);
  });

  const progress = Math.round(((currentStep + 1) / steps.length) * 100);
  const title = steps[currentStep].dataset.title;

  progressBar.style.width = `${progress}%`;
  progressTitle.textContent = title;
  stepCounter.textContent = `Etapa ${currentStep + 1} de ${steps.length}`;

  prevBtn.hidden = false;
  prevBtn.disabled = currentStep === 0;
  nextBtn.hidden = currentStep === steps.length - 1;
  submitBtn.hidden = activeFormMode === "sent" || currentStep !== steps.length - 1;
  saveDraftBtn.hidden = activeFormMode === "sent";
  savePdfBtn.hidden = activeFormMode !== "sent";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setFormViewMode(mode = "edit") {
  const isSentView = mode === "sent";
  activeFormMode = mode;
  formApp.dataset.mode = mode;
  formApp.classList.toggle("sent-full-view", isSentView);
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    if (field.name === "consultorEmail") {
      field.readOnly = true;
      return;
    }

    field.disabled = isSentView;
  });

  if (isSentView) renderSentFullView();
}

function renderSentFullView() {
  currentStep = 0;
  steps.forEach((step) => step.classList.add("is-active"));

  progressBar.style.width = "100%";
  progressTitle.textContent = "Relatório enviado";
  stepCounter.textContent = "Visualização completa";

  prevBtn.hidden = true;
  nextBtn.hidden = true;
  submitBtn.hidden = true;
  saveDraftBtn.hidden = true;
  savePdfBtn.hidden = false;
}

function goToNextStep() {
  showStep(Math.min(currentStep + 1, steps.length - 1));
}

function goToPreviousStep() {
  if (currentStep === 0) return;
  showStep(Math.max(currentStep - 1, 0));
}

function confirmReturnHome() {
  if (activeFormMode === "sent") {
    showDashboard(getAuthorizedEmail());
    return;
  }

  if (!hasReivindicacaoId()) {
    showRequiredReivindicacaoIdDialog({
      title: "Informe o ID para salvar o rascunho",
      description: "O ID da reivindicação é a chave do rascunho. Para salvar este formulário, informe o ID antes de voltar ao início.",
      primaryText: "Salvar rascunho",
      discardText: "Sim, sair sem salvar",
      onConfirm: async () => {
        const saved = await salvarFormulario("Rascunho", { automatico: false });
        if (saved) showDashboard(getAuthorizedEmail());
        return saved;
      },
      onDiscard: () => showDashboard(getAuthorizedEmail())
    });
    return;
  }

  showReturnHomeDialog();
}

function showReturnHomeDialog() {
  const overlay = document.createElement("div");
  const dialog = document.createElement("section");
  const title = document.createElement("h2");
  const actions = document.createElement("div");
  const keepEditingBtn = document.createElement("button");
  const returnHomeBtn = document.createElement("button");

  overlay.className = "confirm-overlay";
  dialog.className = "confirm-dialog";
  title.textContent = "Deseja sair do formulário atual?";
  actions.className = "confirm-actions";
  keepEditingBtn.type = "button";
  keepEditingBtn.className = "ghost";
  keepEditingBtn.textContent = "Continuar editando";
  returnHomeBtn.type = "button";
  returnHomeBtn.textContent = "Voltar ao início";

  keepEditingBtn.addEventListener("click", () => overlay.remove());
  returnHomeBtn.addEventListener("click", () => {
    overlay.remove();
    showDashboard(getAuthorizedEmail());
  });

  actions.append(keepEditingBtn, returnHomeBtn);
  dialog.append(title, actions);
  overlay.append(dialog);
  document.body.append(overlay);
}

function showRequiredReivindicacaoIdDialog({
  title = "ID da reivindicação obrigatório",
  description = "Informe o ID da reivindicação para salvar este rascunho.",
  primaryText = "Salvar rascunho",
  discardText = "Sim, não salvar",
  onConfirm,
  onDiscard
} = {}) {
  const overlay = document.createElement("div");
  const dialog = document.createElement("section");
  const heading = document.createElement("h2");
  const text = document.createElement("p");
  const label = document.createElement("label");
  const input = document.createElement("input");
  const error = document.createElement("span");
  const actions = document.createElement("div");
  const keepEditingBtn = document.createElement("button");
  const discardBtn = document.createElement("button");
  const saveBtn = document.createElement("button");

  overlay.className = "confirm-overlay";
  dialog.className = "confirm-dialog required-id-dialog";
  heading.textContent = title;
  text.textContent = description;
  label.textContent = "ID da reivindicação";
  input.type = "text";
  input.inputMode = "numeric";
  input.pattern = "[0-9]*";
  input.value = getValue("reivindicacaoId");
  input.placeholder = "Digite o ID";
  error.className = "field-error-message";
  actions.className = "confirm-actions";
  keepEditingBtn.type = "button";
  keepEditingBtn.className = "ghost";
  keepEditingBtn.textContent = "Continuar editando";
  discardBtn.type = "button";
  discardBtn.className = "ghost";
  discardBtn.textContent = discardText;
  saveBtn.type = "button";
  saveBtn.textContent = primaryText;

  input.addEventListener("input", () => {
    const numericValue = input.value.replace(/\D/g, "");
    if (input.value !== numericValue) input.value = numericValue;
    error.textContent = "";
    input.classList.remove("field-error");
  });

  keepEditingBtn.addEventListener("click", () => {
    overlay.remove();
    focusReivindicacaoIdField();
  });

  discardBtn.addEventListener("click", () => {
    overlay.remove();
    onDiscard?.();
  });

  saveBtn.addEventListener("click", async () => {
    const id = input.value.trim();
    if (!id) {
      input.classList.add("field-error");
      error.textContent = "Informe o ID para salvar o rascunho.";
      input.focus();
      return;
    }

    setReivindicacaoIdValue(id);
    saveBtn.disabled = true;
    discardBtn.disabled = true;
    keepEditingBtn.disabled = true;
    const confirmed = await onConfirm?.(id);
    if (confirmed === false) {
      saveBtn.disabled = false;
      discardBtn.disabled = false;
      keepEditingBtn.disabled = false;
      return;
    }
    overlay.remove();
  });

  label.append(input, error);
  actions.append(keepEditingBtn, discardBtn, saveBtn);
  dialog.append(heading, text, label, actions);
  overlay.append(dialog);
  document.body.append(overlay);
  input.focus();
}

function hasReivindicacaoId() {
  return Boolean(getValue("reivindicacaoId"));
}

function setReivindicacaoIdValue(id) {
  const field = form.elements.reivindicacaoId;
  if (!field) return;
  field.value = String(id || "").replace(/\D/g, "");
  handleFormChange({ target: field });
}

function focusReivindicacaoIdField() {
  const field = form.elements.reivindicacaoId;
  if (!field) return;
  const stepIndex = steps.findIndex((step) => step.contains(field));
  if (stepIndex >= 0) showStep(stepIndex);
  field.focus();
}

function updateConditionals({ renderDynamic = true } = {}) {
  setConditional("outrosNomesDetalhe", getValue("outrosNomes") === "Sim");
  setConditional("outraEtniaWrap", selectedEtnias.includes("Outros"));
  setConditional("judicializadoDetalhes", getValue("estaJudicializado") === "Sim");
  setConditional("classificacaoJudicializacaoOutrosWrap", getCheckedValues("tiposAcaoJudicial").includes("Outros"));
  if (renderDynamic) renderAcoesJudiciaisDetalhadas();
  setConditional("mapasCartograficosWrap", getValue("temMapaCartografico") === "Sim");
  setConditional("sobreposicoesWrap", getValue("sobreposicoes") === "Sim");
  setConditional("aldeiasComunidadesWrap", getValue("citaAldeiasComunidades") === "Sim");
  setConditional("detalhesContextoUrbanoWrap", getValue("contextoUrbano") === "Sim");
  setConditional("detalhesFaixaFronteiraWrap", getValue("faixaFronteira") === "Sim");
  setConditional("indigenasAreaWrap", getValue("indigenasArea") === "Sim");
  setConditional("comunidadesTradicionaisWrap", getValue("comunidadesTradicionais") === "Sim");
  setConditional("outrasComunidadesTradicionaisWrap", selectedComunidadesTradicionais.includes("Outros"));
  setConditional("conflitoInteretnicoWrap", getValue("conflitoInteretnico") === "Sim");
  if (renderDynamic) renderDetalhesConflitos();
  setConditional("povosIsoladosWrap", getValue("povosIsolados") === "Sim");
  setConditional("reintegracaoPosseWrap", getValue("reintegracaoPosse") === "Sim");
  setConditional("detalhesRetomadaWrap", getValue("temRetomada") === "Sim");
  setConditional("outroVulnerabilidadeWrap", getCheckedValues("vulnerabilidades").includes("Outros"));
  updateVulnerabilityDetails();
  updateCoordinateFormatDetails();

  const demandas = getCheckedValues("tipoDemanda");
  const hasUltimoAtoRegularizacao = Boolean(getValue("ultimoAtoRegularizacao"));
  setConditional("nomeDocumentoRegularizacaoWrap", hasUltimoAtoRegularizacao);
  setConditional("dataDocumentoRegularizacaoWrap", hasUltimoAtoRegularizacao);
  if (!hasUltimoAtoRegularizacao) {
    clearFieldValue("nomeDocumentoRegularizacao");
    clearFieldValue("dataDocumentoRegularizacao");
  }

  const hasImovelDestinacao = getValue("imovelDestinacaoComunidade") === "Sim";
  setConditional("informacoesImovelDestinacaoWrap", hasImovelDestinacao);
  if (!hasImovelDestinacao) clearFieldValue("informacoesImovelDestinacao");

  setConditional("modalidadeReservaWrap", hasDemand(demandas, "Reserva Indígena"));
  setConditional("justificativaRevisaoWrap", hasDemand(demandas, "Revisão de limites"));
  setConditional("justificativaRevisaoTextoWrap", hasDemand(demandas, "Revisão de limites") && getValue("temJustificativaRevisao") === "Sim");
}

function setConditional(id, isVisible, requiredNames = []) {
  const element = document.getElementById(id);
  if (!element) return;

  element.classList.toggle("is-visible", isVisible);
  element.querySelectorAll("input, select, textarea").forEach((field) => {
    if (!isVisible) {
      field.classList.remove("invalid");
      clearFieldError(field.name);
      if (requiredNames.includes(field.name)) field.required = false;
      return;
    }

    if (requiredNames.includes(field.name)) field.required = true;
  });
}

function validateCurrentStep() {
  return validateRequiredFields(true).length === 0;
}

function validateRequiredFields(isDraftSave = false) {
  clearValidationErrors();
  if (isDraftSave) return [];

  updateConditionals();
  const errors = [];
  const demandas = getCheckedValues("tipoDemanda");
  const requiredRules = [
    { fieldId: "consultorNome", label: "Nome completo do(a) consultor(a)", isValid: () => hasValue("consultorNome") },
    { fieldId: "areaEstudo", label: "Área de estudo", isValid: () => hasValue("areaEstudo") },
    { fieldId: "reivindicacaoId", label: "ID", isValid: () => hasValue("reivindicacaoId") },
    { fieldId: "nomeReivindicacao", label: "Nome da reivindicação", isValid: () => hasValue("nomeReivindicacao") },
    { fieldId: "outrosNomes", label: "Outros nomes da reivindicação", isValid: () => hasChecked("outrosNomes") },
    { fieldId: "outrosNomesTexto", label: "Outros nomes da reivindicação", isValid: () => getValue("outrosNomes") !== "Sim" || hasValue("outrosNomesTexto") },
    { fieldId: "etnias", label: "Etnia", isValid: () => selectedEtnias.length > 0 },
    { fieldId: "outraEtnia", label: "Outra etnia", isValid: () => !selectedEtnias.includes("Outros") || selectedOutrasEtnias.length > 0 },
    { fieldId: "tipoDemanda", label: "Tipo da demanda", isValid: () => demandas.length > 0 },
    { fieldId: "modalidadeConstituicao", label: "Modalidade de Constituição", isValid: () => !hasDemand(demandas, "Reserva Indígena") || hasValue("modalidadeConstituicao") },
    { fieldId: "temJustificativaRevisao", label: "Há justificativa para a demanda por revisão de limites", isValid: () => !hasDemand(demandas, "Revisão de limites") || hasChecked("temJustificativaRevisao") },
    { fieldId: "justificativaRevisao", label: "Justificativa da Revisão", isValid: () => getValue("temJustificativaRevisao") !== "Sim" || hasValue("justificativaRevisao") },
    { fieldId: "estados", label: "Estado", isValid: () => selectedEstados.length > 0 },
    { fieldId: "coordenacaoRegional", label: "Coordenação Regional", isValid: () => hasValue("coordenacaoRegional") },
    { fieldId: "temMapaCartografico", label: "Mapa e material cartográfico", isValid: () => hasChecked("temMapaCartografico") },
    { fieldId: "citaAldeiasComunidades", label: "Aldeias ou comunidades", isValid: () => hasChecked("citaAldeiasComunidades") },
    { fieldId: "contextoUrbano", label: "Contexto urbano", isValid: () => hasChecked("contextoUrbano") },
    { fieldId: "faixaFronteira", label: "Faixa de fronteira", isValid: () => hasChecked("faixaFronteira") },
    { fieldId: "sobreposicoes", label: "Sobreposições", isValid: () => hasChecked("sobreposicoes") },
    { fieldId: "temRetomada", label: "Ação de retomada do território", isValid: () => hasChecked("temRetomada") },
    { fieldId: "estaJudicializado", label: "Há ações judiciais contra a FUNAI", isValid: () => hasChecked("estaJudicializado") },
    { fieldId: "tiposAcaoJudicial", label: "Motivação", isValid: () => getValue("estaJudicializado") !== "Sim" || getCheckedValues("tiposAcaoJudicial").length > 0 },
    { fieldId: "classificacaoJudicializacaoOutros", label: "Outra motivação", isValid: () => !getCheckedValues("tiposAcaoJudicial").includes("Outros") || hasValue("classificacaoJudicializacaoOutros") },
    { fieldId: "detalhesRetomada", label: "Detalhes da retomada", isValid: () => getValue("temRetomada") !== "Sim" || hasValue("detalhesRetomada") },
    { fieldId: "descricaoAcao", label: "Descrição da ação judicial", isValid: () => !getCheckedValues("acoesJudiciais").includes("Outros") || hasValue("descricaoAcao") },
    { fieldId: "detalheOutrasSobreposicoes", label: "Detalhe de outras sobreposições", isValid: () => !getCheckedValues("tiposSobreposicao").includes("Outros") || hasValue("detalheOutrasSobreposicoes") },
    { fieldId: "descricaoReivindicacao", label: "Descrição da reivindicação", isValid: () => hasValue("descricaoReivindicacao") },
    { fieldId: "indigenasArea", label: "Indígenas na área reivindicada", isValid: () => hasChecked("indigenasArea") },
    { fieldId: "comunidadesTradicionais", label: "Comunidades tradicionais", isValid: () => hasChecked("comunidadesTradicionais") },
    { fieldId: "conflitoInteretnico", label: "Conflito na área reivindicada", isValid: () => hasChecked("conflitoInteretnico") },
    { fieldId: "povosIsolados", label: "Povos isolados", isValid: () => hasChecked("povosIsolados") },
    { fieldId: "detalhesPovosIsolados", label: "Detalhes de povos isolados", isValid: () => getValue("povosIsolados") !== "Sim" || hasValue("detalhesPovosIsolados") },
    { fieldId: "reintegracaoPosse", label: "Reintegração de posse", isValid: () => hasChecked("reintegracaoPosse") },
    { fieldId: "outroCriterioVulnerabilidade", label: "Outro critério de vulnerabilidade", isValid: () => !getCheckedValues("vulnerabilidades").includes("Outros") || hasValue("outroCriterioVulnerabilidade") },
    { fieldId: "descricaoComunidadeTradicional", label: "Outra comunidade tradicional", isValid: () => !selectedComunidadesTradicionais.includes("Outros") || hasValue("descricaoComunidadeTradicional") },
    { fieldId: "outroTipoConflito", label: "Outro tipo de conflito", isValid: () => !getCheckedValues("tiposConflito").includes("Outro") || getDetalhesConflitos().some((item) => item.tipo === "Outro" && item.outroTipoConflito) },
    { fieldId: "coordenadas", label: "Coordenadas geográficas", isValid: () => areCoordenadasValid() }
  ];

  requiredRules.forEach((rule) => {
    if (rule.isValid()) return;
    const error = showFieldError(rule.fieldId, rule.message || getRequiredFieldMessage(rule.fieldId));
    errors.push({
      fieldId: rule.fieldId,
      label: rule.label,
      stepIndex: error.stepIndex,
      target: error.target
    });
  });

  getInvalidDateFields().forEach((field, index) => {
    const error = showControlError(field, `dateField-${index}`, "Informe uma data válida no formato dd/mm/aaaa.");
    errors.push({
      fieldId: `dateField-${index}`,
      label: getDateFieldLabel(field),
      stepIndex: error.stepIndex,
      target: error.target
    });
  });

  if (getValue("estaJudicializado") === "Sim") {
    getAcoesJudiciaisDetalhadas().forEach((acao, index) => {
      const prefix = `acaoJudicialDetalhada-${index}`;
      if (!acao.numeroProcessoSei && !acao.numeroAcao) {
        const error = showFieldError(`${prefix}-numero`, "Informe o número da ação ou do processo SEI");
        errors.push({
          fieldId: `${prefix}-numero`,
          label: `${acao.tipo}: número da ação ou processo SEI`,
          stepIndex: error.stepIndex,
          target: error.target
        });
      }

      if (!acao.temDecisaoJudicial) {
        const error = showFieldError(`${prefix}-decisao`, "Selecione uma opção para continuar.");
        errors.push({
          fieldId: `${prefix}-decisao`,
          label: `${acao.tipo}: decisão judicial`,
          stepIndex: error.stepIndex,
          target: error.target
        });
      }

      if (acao.temDecisaoJudicial === "Sim" && !acao.detalhesDecisao) {
        const error = showFieldError(`${prefix}-detalhesDecisao`, "Campo obrigatório");
        errors.push({
          fieldId: `${prefix}-detalhesDecisao`,
          label: `${acao.tipo}: detalhes sobre a decisão`,
          stepIndex: error.stepIndex,
          target: error.target
        });
      }
    });
  }

  return errors;
}

function getRequiredFieldMessage(fieldId) {
  return isRadioOptionGroup(fieldId) ? "Selecione uma opção para continuar." : "Campo obrigatório.";
}

function isRadioOptionGroup(fieldId) {
  const element = form.elements[fieldId];
  const controls = element instanceof RadioNodeList ? Array.from(element) : [element].filter(Boolean);
  return controls.some((field) => field?.type === "radio");
}

function getInvalidDateFields() {
  return Array.from(form.querySelectorAll("input[type='text']"))
    .filter((field) => isBrazilianDateField(field) && isFieldVisible(field) && field.value.trim() && !isBrazilianDateCompleteAndValid(field.value));
}

function getDateFieldLabel(field) {
  return asText(field.closest("label")?.textContent || field.getAttribute("aria-label") || "Data").replace(/\s+/g, " ");
}

function clearValidationErrors() {
  form.querySelectorAll(".field-error, [data-error-field]").forEach((element) => {
    element.classList.remove("field-error");
    delete element.dataset.errorField;
  });
  form.querySelectorAll(".field-error-message").forEach((element) => element.remove());
}

function clearResolvedValidationErrors() {
  const activeErrors = Array.from(form.querySelectorAll("[data-error-field]"));
  activeErrors.forEach((element) => {
    const fieldId = element.dataset.errorField;
    if (!isRequiredFieldResolved(fieldId)) return;
    clearFieldError(fieldId);
  });
}

function showFieldError(fieldId, message) {
  const target = getFieldErrorTarget(fieldId);
  const container = target?.container || target?.control;
  const control = target?.control;
  const step = container?.closest(".step") || control?.closest(".step");
  const stepIndex = steps.indexOf(step);

  if (container) {
    container.classList.add("field-error");
    container.dataset.errorField = fieldId;
  }

  if (control) {
    control.classList.add("field-error");
    control.dataset.errorField = fieldId;
  }

  if (container && !container.querySelector(`.field-error-message[data-error-for="${fieldId}"]`)) {
    const errorMessage = document.createElement("small");
    errorMessage.className = "field-error-message";
    errorMessage.dataset.errorFor = fieldId;
    errorMessage.textContent = message;
    container.append(errorMessage);
  }

  return {
    target: container || control,
    stepIndex: stepIndex >= 0 ? stepIndex : 0
  };
}

function goToFirstErrorStep(errors) {
  if (!errors.length) return;

  const [firstError] = errors;
  showStep(firstError.stepIndex);
  setTimeout(() => {
    const target = getFieldErrorTarget(firstError.fieldId)?.container || firstError.target;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

function clearFieldError(fieldId) {
  form.querySelectorAll(`[data-error-field="${fieldId}"]`).forEach((element) => {
    element.classList.remove("field-error");
    delete element.dataset.errorField;
  });
  form.querySelectorAll(`.field-error-message[data-error-for="${fieldId}"]`).forEach((element) => element.remove());
}

function getFieldErrorTarget(fieldId) {
  const customTargets = {
    etnias: () => ({ container: etniaInput.closest(".multi-autocomplete"), control: etniaInput }),
    outraEtnia: () => ({ container: document.querySelector("#outraEtniaWrap"), control: outraEtniaInput }),
    estados: () => ({ container: estadoInput.closest(".multi-autocomplete"), control: estadoInput }),
    municipios: () => ({ container: municipioInput.closest(".multi-autocomplete"), control: municipioInput }),
    coordenadas: () => {
      const section = document.querySelector("#coordenadasWrap");
      return { container: section, control: section?.querySelector(".coordinate-table") };
    },
    tipoDemanda: () => {
      const group = form.querySelector("[data-required-group='tipoDemanda']");
      return { container: group?.closest("fieldset") || group, control: group };
    },
    tiposAcaoJudicial: () => {
      const group = form.querySelector("[data-required-group='tiposAcaoJudicial']");
      return { container: group, control: group?.querySelector(".check-grid") || group };
    },
    outroTipoConflito: () => {
      const control = form.querySelector("[data-conflict-detail='Outro'] [data-conflict-other-type]");
      return { container: control?.closest("label, .conflict-detail-card"), control };
    }
  };

  if (fieldId.startsWith("acaoJudicialDetalhada-")) {
    const [, index, field] = fieldId.split("-");
    const card = form.querySelector(`[data-acao-judicial-index="${index}"]`);
    let control = card;
    if (field === "numero") control = card?.querySelector("[data-acao-numero-sei]") || card?.querySelector("[data-acao-numero-acao]");
    if (field === "decisao") control = card?.querySelector(".judicial-decision-fieldset");
    if (field === "detalhesDecisao") control = card?.querySelector("[data-acao-detalhes-decisao]");
    return { container: control?.closest("label, fieldset, .judicial-action-card") || card, control };
  }

  if (customTargets[fieldId]) return customTargets[fieldId]();

  const element = form.elements[fieldId];
  if (!element) return {};
  const controls = element instanceof RadioNodeList ? Array.from(element) : [element];
  const firstControl = controls[0];
  const isGroup = firstControl?.type === "radio" || firstControl?.type === "checkbox";
  const container = isGroup ? firstControl.closest("fieldset") : firstControl.closest("label, fieldset, .multi-autocomplete");

  return {
    container,
    control: isGroup ? container?.querySelector(".check-grid") || container : firstControl
  };
}

function isRequiredFieldResolved(fieldId) {
  const demandas = getCheckedValues("tipoDemanda");
  const resolved = {
    consultorNome: () => hasValue("consultorNome"),
    areaEstudo: () => hasValue("areaEstudo"),
    reivindicacaoId: () => hasValue("reivindicacaoId"),
    nomeReivindicacao: () => hasValue("nomeReivindicacao"),
    outrosNomes: () => hasChecked("outrosNomes"),
    outrosNomesTexto: () => getValue("outrosNomes") !== "Sim" || hasValue("outrosNomesTexto"),
    etnias: () => selectedEtnias.length > 0,
    outraEtnia: () => !selectedEtnias.includes("Outros") || selectedOutrasEtnias.length > 0,
    tipoDemanda: () => demandas.length > 0,
    modalidadeConstituicao: () => !hasDemand(demandas, "Reserva Indígena") || hasValue("modalidadeConstituicao"),
    temJustificativaRevisao: () => !hasDemand(demandas, "Revisão de limites") || hasChecked("temJustificativaRevisao"),
    justificativaRevisao: () => getValue("temJustificativaRevisao") !== "Sim" || hasValue("justificativaRevisao"),
    estados: () => selectedEstados.length > 0,
    coordenacaoRegional: () => hasValue("coordenacaoRegional"),
    temMapaCartografico: () => hasChecked("temMapaCartografico"),
    citaAldeiasComunidades: () => hasChecked("citaAldeiasComunidades"),
    contextoUrbano: () => hasChecked("contextoUrbano"),
    faixaFronteira: () => hasChecked("faixaFronteira"),
    sobreposicoes: () => hasChecked("sobreposicoes"),
    temRetomada: () => hasChecked("temRetomada"),
    detalhesRetomada: () => getValue("temRetomada") !== "Sim" || hasValue("detalhesRetomada"),
    estaJudicializado: () => hasChecked("estaJudicializado"),
    tiposAcaoJudicial: () => getValue("estaJudicializado") !== "Sim" || getCheckedValues("tiposAcaoJudicial").length > 0,
    classificacaoJudicializacaoOutros: () => !getCheckedValues("tiposAcaoJudicial").includes("Outros") || hasValue("classificacaoJudicializacaoOutros"),
    descricaoReivindicacao: () => hasValue("descricaoReivindicacao"),
    indigenasArea: () => hasChecked("indigenasArea"),
    comunidadesTradicionais: () => hasChecked("comunidadesTradicionais"),
    conflitoInteretnico: () => hasChecked("conflitoInteretnico"),
    povosIsolados: () => hasChecked("povosIsolados"),
    detalhesPovosIsolados: () => getValue("povosIsolados") !== "Sim" || hasValue("detalhesPovosIsolados"),
    reintegracaoPosse: () => hasChecked("reintegracaoPosse"),
    coordenadas: () => areCoordenadasValid()
  };

  if (fieldId.startsWith("acaoJudicialDetalhada-")) return isAcaoJudicialDetalhadaResolved(fieldId);

  return resolved[fieldId]?.() ?? true;
}

function clearControlError(control) {
  if (!control) return;
  const container = control.closest("label, td, fieldset, .vulnerability-detail-row, .community-detail-row, .conflict-detail-card");
  const fieldId = control.dataset.errorField;
  control.classList.remove("field-error", "invalid");
  if (fieldId) delete control.dataset.errorField;

  if (!container) return;
  if (fieldId) {
    container.querySelectorAll(`.field-error-message[data-error-for="${fieldId}"]`).forEach((element) => element.remove());
  }
  if (!container.querySelector(".field-error, .invalid")) {
    container.classList.remove("field-error");
    if (container.dataset.errorField === fieldId) delete container.dataset.errorField;
  }
}

function showControlError(control, fieldId, message) {
  const container = control.closest("label, td, fieldset, .vulnerability-detail-row, .community-detail-row, .conflict-detail-card");
  const step = container?.closest(".step") || control.closest(".step");
  const stepIndex = steps.indexOf(step);

  control.classList.add("field-error");
  control.dataset.errorField = fieldId;
  if (container) {
    container.classList.add("field-error");
    container.dataset.errorField = fieldId;
  }

  if (container && !container.querySelector(`.field-error-message[data-error-for="${fieldId}"]`)) {
    const errorMessage = document.createElement("small");
    errorMessage.className = "field-error-message";
    errorMessage.dataset.errorFor = fieldId;
    errorMessage.textContent = message;
    container.append(errorMessage);
  }

  return {
    target: container || control,
    stepIndex: stepIndex >= 0 ? stepIndex : 0
  };
}

function isAcaoJudicialDetalhadaResolved(fieldId) {
  const [, rawIndex, field] = fieldId.split("-");
  const acao = getAcoesJudiciaisDetalhadas()[Number(rawIndex)] || {};
  if (field === "numero") return Boolean(acao.numeroProcessoSei || acao.numeroAcao);
  if (field === "decisao") return Boolean(acao.temDecisaoJudicial);
  if (field === "detalhesDecisao") return acao.temDecisaoJudicial !== "Sim" || Boolean(acao.detalhesDecisao);
  return true;
}

function getAcoesJudiciaisDetalhadas() {
  return Array.from(form.querySelectorAll("[data-acao-judicial-card]"))
    .map((card) => ({
      tipo: asText(card.dataset.acaoJudicialTipo),
      acpOutros: asText(card.querySelector("[data-acao-acp-outros]")?.value),
      numeroProcessoSei: asText(card.querySelector("[data-acao-numero-sei]")?.value),
      numeroAcao: asText(card.querySelector("[data-acao-numero-acao]")?.value),
      detalhesJudicializacao: asText(card.querySelector("[data-acao-detalhes]")?.value),
      data: prepararDataParaPayload(card.querySelector("[data-acao-data]")?.value),
      temDecisaoJudicial: asText(card.querySelector("input[type='radio']:checked")?.value),
      detalhesDecisao: asText(card.querySelector("[data-acao-detalhes-decisao]")?.value)
    }))
    .filter((item) => item.tipo);
}

function getMotivacaoJudicializacao() {
  const tipos = getCheckedValues("tiposAcaoJudicial");
  if (!tipos.length) return "";

  const outraMotivacao = asText(getValue("classificacaoJudicializacaoOutros"));
  return tipos
    .map((tipo) => tipo === "Outros" && outraMotivacao ? `Outros: ${outraMotivacao}` : tipo)
    .join(", ");
}

function renderAcoesJudiciaisDetalhadas(existingDetails) {
  const container = document.getElementById("acoesJudiciaisDetalhadas");
  if (!container) return;

  const currentDetails = existingDetails || getAcoesJudiciaisDetalhadas();
  const selected = existingDetails
    ? (normalizeAcoesJudiciaisDetalhadas(currentDetails).map((item) => item.tipo).filter(Boolean).length
      ? normalizeAcoesJudiciaisDetalhadas(currentDetails).map((item) => item.tipo).filter(Boolean)
      : getCheckedValues("tiposAcaoJudicial"))
    : (getValue("estaJudicializado") === "Sim" ? getCheckedValues("tiposAcaoJudicial") : []);
  const detailMap = new Map(normalizeAcoesJudiciaisDetalhadas(currentDetails).map((item) => [item.tipo, item]));
  const previousSignature = container.dataset.selectedTipos || "";
  const nextSignature = selected.join("|");

  if (!existingDetails && previousSignature === nextSignature) {
    updateAcoesJudiciaisDecisaoVisibility();
    return;
  }

  container.dataset.selectedTipos = nextSignature;
  container.innerHTML = "";

  selected.forEach((tipo, index) => {
    const detail = detailMap.get(tipo) || { tipo };
    const card = document.createElement("section");
    card.className = "judicial-action-card";
    card.dataset.acaoJudicialCard = "true";
    card.dataset.acaoJudicialTipo = tipo;
    card.dataset.acaoJudicialIndex = String(index);
    card.innerHTML = `
      <h3>${tipo}</h3>
      <div class="action-grid">
        <label>
          Qual ação? / ACP ou outros
          <input type="text" data-acao-acp-outros placeholder="Descreva a ação">
        </label>
        <label>
          Número do processo SEI
          <input type="text" data-acao-numero-sei placeholder="Número do processo SEI">
        </label>
        <label>
          Número da ação
          <input type="text" data-acao-numero-acao placeholder="Número da ação">
        </label>
        <label>
          Data
          <input name="dataAcaoJudicialDetalhada" type="text" inputmode="numeric" data-acao-data placeholder="dd/mm/aaaa">
        </label>
        <label class="wide">
          Detalhes sobre a judicialização
          <textarea rows="3" data-acao-detalhes placeholder="Detalhe sobre a judicialização"></textarea>
        </label>
      </div>
      <fieldset class="judicial-decision-fieldset">
        Há decisão judicial?
        <div class="check-grid">
          <label><input type="radio" name="temDecisaoJudicial_${index}" value="Sim"> Sim</label>
          <label><input type="radio" name="temDecisaoJudicial_${index}" value="Não"> Não</label>
          <label><input type="radio" name="temDecisaoJudicial_${index}" value="Sem informação"> Sem informação</label>
        </div>
      </fieldset>
      <label class="conditional judicial-decision-details">
        Detalhes sobre a decisão
        <textarea rows="3" data-acao-detalhes-decisao placeholder="Detalhe sobre a decisão"></textarea>
      </label>
    `;

    card.querySelector("[data-acao-acp-outros]").value = asText(detail.acpOutros);
    card.querySelector("[data-acao-numero-sei]").value = asText(detail.numeroProcessoSei);
    card.querySelector("[data-acao-numero-acao]").value = asText(detail.numeroAcao);
    card.querySelector("[data-acao-data]").value = converterDataParaBR(detail.data);
    card.querySelector("[data-acao-detalhes]").value = asText(detail.detalhesJudicializacao);
    card.querySelector("[data-acao-detalhes-decisao]").value = asText(detail.detalhesDecisao);
    const decisao = asText(detail.temDecisaoJudicial);
    if (decisao) {
      const radio = Array.from(card.querySelectorAll("input[type='radio']")).find((field) => field.value === decisao);
      if (radio) radio.checked = true;
    }

    container.append(card);
  });

  updateAcoesJudiciaisDecisaoVisibility();
}

function updateAcoesJudiciaisDecisaoVisibility() {
  form.querySelectorAll("[data-acao-judicial-card]").forEach((card) => {
    const decisao = asText(card.querySelector("input[type='radio']:checked")?.value);
    card.querySelector(".judicial-decision-details")?.classList.toggle("is-visible", decisao === "Sim");
  });
}

function restoreAcoesJudiciaisDetalhadas(values) {
  const details = normalizeAcoesJudiciaisDetalhadas(values.acoesJudiciaisDetalhadas);
  const fallbackDetails = details.length ? details : normalizeLegacyAcoesJudiciais(values);
  const selectedTipos = fallbackDetails.length
    ? fallbackDetails.map((item) => item.tipo).filter(Boolean)
    : normalizeTiposAcaoJudicial(values.tiposAcaoJudicial || values.classificacaoJudicializacao || values.acoesJudiciais || values.motivacaoJudicializacao);

  form.querySelectorAll('input[name="tiposAcaoJudicial"]').forEach((field) => {
    field.checked = selectedTipos.includes(field.value);
  });

  const outroInput = form.elements.classificacaoJudicializacaoOutros;
  if (outroInput) {
    const outroDetalhado = fallbackDetails.find((item) => item.tipo === "Outros")?.acpOutros;
    outroInput.value = asText(values.classificacaoJudicializacaoOutros || outroDetalhado || extractOutraMotivacao(values.motivacaoJudicializacao));
  }

  renderAcoesJudiciaisDetalhadas(fallbackDetails);
}

function normalizeAcoesJudiciaisDetalhadas(value) {
  let items = value;
  if (typeof value === "string") {
    try {
      items = JSON.parse(value);
    } catch (error) {
      items = [];
    }
  }

  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      tipo: asText(item?.tipo),
      acpOutros: asText(item?.acpOutros),
      numeroProcessoSei: asText(item?.numeroProcessoSei),
      numeroAcao: asText(item?.numeroAcao),
      detalhesJudicializacao: asText(item?.detalhesJudicializacao),
      data: prepararDataParaPayload(item?.data),
      temDecisaoJudicial: asText(item?.temDecisaoJudicial),
      detalhesDecisao: asText(item?.detalhesDecisao)
    }))
    .filter((item) => item.tipo);
}

function normalizeLegacyAcoesJudiciais(values = {}) {
  const tipos = normalizeTiposAcaoJudicial(values.tiposAcaoJudicial || values.classificacaoJudicializacao || values.acoesJudiciais || values.motivacaoJudicializacao);
  const tipo = tipos[0] || "";
  if (!tipo) return [];

  return [{
    tipo,
    acpOutros: asText(values.descricaoAcao || values.classificacaoJudicializacaoOutros),
    numeroProcessoSei: asText(values.numeroProcessoSeiJudicial),
    numeroAcao: asText(values.numeroAcaoJudicial || values.numeroProcessoJudicial),
    detalhesJudicializacao: asText(values.detalhesJudicializacao),
    data: prepararDataParaPayload(values.dataAcaoJudicial),
    temDecisaoJudicial: asText(values.temDecisao),
    detalhesDecisao: asText(values.detalhesDecisao)
  }];
}

function normalizeTiposAcaoJudicial(value) {
  return asListOrSplit(value)
    .map((tipo) => tipo.startsWith("Outros:") ? "Outros" : tipo)
    .map((tipo) => TIPOS_ACAO_JUDICIAL.includes(tipo) ? tipo : "")
    .filter(Boolean);
}

function extractOutraMotivacao(value) {
  const item = asListOrSplit(value).find((tipo) => tipo.startsWith("Outros:"));
  return item ? item.replace(/^Outros:\s*/, "") : "";
}

function normalizeEstaJudicializado(value) {
  const text = asText(value);
  return text === "Não" ? "Sem informação" : text;
}

function hasValue(name) {
  return Boolean(getValue(name));
}

function hasChecked(name) {
  return getCheckedValues(name).length > 0;
}

function hasDemand(demandas, value) {
  const normalizedValue = normalizeText(value);
  return demandas.some((demanda) => {
    const normalizedDemand = normalizeText(demanda);
    if (normalizedValue.includes("reserva")) return normalizedDemand.includes("reserva");
    if (normalizedValue.includes("revisao")) return normalizedDemand.includes("revis");
    return normalizedDemand === normalizedValue;
  });
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function enviarFormulario(event) {
  event.preventDefault();
  cancelarAutosavePendente();
  envioFinalEmAndamento = true;

  if (autosavePromise) {
    await autosavePromise;
  }

  const isDraftSave = false;
  const validationErrors = validateRequiredFields(isDraftSave);
  if (validationErrors.length) {
    showMessage(`Existem campos obrigatórios não preenchidos. Revise os campos destacados em vermelho. Campos: ${validationErrors.map((error) => error.label).join(", ")}.`, "error");
    goToFirstErrorStep(validationErrors);
    envioFinalEmAndamento = false;
    return;
  }

  const authorizedEmail = getStoredAuthorizedEmail();
  if (!authorizedEmail || !hasActiveSession()) {
    showAccessScreen();
    envioFinalEmAndamento = false;
    showAccessMessage("Informe seu e-mail para acessar o formulário.", "error");
    return;
  }

  setAuthorizedEmail(authorizedEmail);

  blockDraftSavesForFormulario();
  const enviado = await salvarFormulario("Enviado");
  envioFinalEmAndamento = false;
  return enviado;
}

async function handleSubmit(event) {
  return enviarFormulario(event);
}

function buildPayload(statusFormulario = "Enviado") {
  const now = new Date().toISOString();
  const dadosCompletos = montarFormularioJson(statusFormulario, now);
  const payload = {
    ...dadosCompletos,
    formularioJson: JSON.stringify(dadosCompletos)
  };
  return garantirTiposPayload(payload);
}

function clearFieldValue(name) {
  const element = form?.elements[name];
  if (!element) return;
  const fields = element instanceof RadioNodeList ? Array.from(element) : [element];
  fields.forEach((field) => {
    if (field.type === "checkbox" || field.type === "radio") {
      field.checked = false;
      return;
    }
    field.value = "";
  });
  clearFieldError(name);
}

function garantirTiposPayload(payload) {
  const normalizado = {
    ...payload,
    formularioJson: normalizarTextoParaPowerAutomate(payload.formularioJson),
    consultor: garantirObjeto(payload.consultor),
    reivindicacao: garantirObjeto(payload.reivindicacao),
    resumoProcesso: garantirObjeto(payload.resumoProcesso),
    statusProcesso: garantirObjeto(payload.statusProcesso),
    caracterizacaoArea: garantirObjeto(payload.caracterizacaoArea),
    ocupacaoIndigena: garantirObjeto(payload.ocupacaoIndigena)
  };

  normalizado.resumoProcesso.documentos = garantirArray(normalizado.resumoProcesso.documentos);
  normalizado.statusProcesso.tiposAcaoJudicial = garantirArray(normalizado.statusProcesso.tiposAcaoJudicial);
  normalizado.statusProcesso.acoesJudiciaisDetalhadas = garantirArray(normalizado.statusProcesso.acoesJudiciaisDetalhadas);
  normalizado.caracterizacaoArea.coordenadas = garantirArray(normalizado.caracterizacaoArea.coordenadas);
  normalizado.caracterizacaoArea.coordenadasDetalhadas = garantirArray(normalizado.caracterizacaoArea.coordenadasDetalhadas);
  normalizado.caracterizacaoArea.mapasCartograficos = garantirArray(normalizado.caracterizacaoArea.mapasCartograficos);
  normalizado.ocupacaoIndigena.detalhesVulnerabilidades = garantirArray(normalizado.ocupacaoIndigena.detalhesVulnerabilidades);
  normalizado.ocupacaoIndigena.detalhesComunidadesTradicionais = garantirArray(normalizado.ocupacaoIndigena.detalhesComunidadesTradicionais);
  normalizado.ocupacaoIndigena.detalhesConflitos = garantirArray(normalizado.ocupacaoIndigena.detalhesConflitos);

  return normalizado;
}

function garantirObjeto(valor) {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {};
}

function garantirArray(valor) {
  return Array.isArray(valor) ? valor : [];
}

function validarFormularioJsonAntesDoEnvio(payload) {
  const formularioJsonTexto = typeof payload?.formularioJson === "string"
    ? asText(payload.formularioJson)
    : JSON.stringify(payload?.formularioJson || {});
  let formularioJson = {};
  let parseError = null;

  try {
    formularioJson = formularioJsonTexto ? JSON.parse(formularioJsonTexto) : {};
  } catch (error) {
    parseError = error;
  }

  const camposAusentes = parseError
    ? REQUIRED_FORMULARIO_JSON_BLOCKS
    : REQUIRED_FORMULARIO_JSON_BLOCKS.filter((campo) => !garantirObjeto(formularioJson[campo]) || Object.keys(formularioJson[campo]).length === 0);

  console.log("FormularioJson tamanho caracteres", formularioJsonTexto.length);
  console.log("FormularioJson campos ausentes", camposAusentes);
  if (parseError) console.error("FormularioJson inválido", parseError);

  return {
    isValid: !parseError && camposAusentes.length === 0,
    tamanho: formularioJsonTexto.length,
    camposAusentes,
    parseError
  };
}

function calcularTamanhoFormularioJson(payload) {
  const formularioJson = typeof payload?.formularioJson === "string"
    ? asText(payload.formularioJson)
    : JSON.stringify(payload?.formularioJson || payload || {});
  const tamanhoFormulario = formularioJson.length;
  const tamanhoBytes = new TextEncoder().encode(formularioJson).length;
  const tamanhoKb = tamanhoBytes / 1024;
  return {
    formularioJson,
    tamanhoFormulario,
    tamanhoBytes,
    tamanhoKb
  };
}

function updateFormularioJsonSizeMeter() {
  if (!formSizeMeter || !form) return;

  try {
    const payload = normalizarPayloadParaPowerAutomate(buildPayload(activeFormMode === "sent" ? "Enviado" : "Rascunho"));
    const { tamanhoFormulario, tamanhoKb } = calcularTamanhoFormularioJson(payload);
    formSizeMeter.textContent = `Tamanho atual do JSON: ${tamanhoKb.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KB`;
    formSizeMeter.title = `${tamanhoFormulario.toLocaleString("pt-BR")} caracteres`;
  } catch (error) {
    formSizeMeter.textContent = "Tamanho atual do JSON: --";
  }
}

function montarFormularioJson(statusFormulario = "Rascunho", now = new Date().toISOString()) {
  const etnias = asList(getSelectedEtnias());
  const outrasEtnias = asList(getSelectedOutrasEtnias());
  const estados = asList(getSelectedEstados());
  const municipios = asList(getSelectedMunicipios());
  const documentos = asList(getDocumentosProcesso());
  const primeiroDocumento = documentos[0] || {};
  const coordenadasDetalhadas = asList(getCoordenadasDetalhadas());
  const coordenadas = asList(getCoordenadasGeograficas());
  const primeiraCoordenada = coordenadasDetalhadas[0] || {};
  const mapasCartograficos = asList(getMapasCartograficos());
  const tiposAcaoJudicial = asList(getCheckedValues("tiposAcaoJudicial"));
  const acoesJudiciaisDetalhadas = asList(getAcoesJudiciaisDetalhadas());
  const primeiraAcaoJudicial = acoesJudiciaisDetalhadas[0] || {};
  const detalhesConflitos = asList(getDetalhesConflitos());
  const primeiroConflito = detalhesConflitos[0] || {};

  return {
    formularioId: asText(getCurrentFormularioId()),
    tokenSecreto: asText(SECRET_TOKEN),
    statusFormulario: asText(statusFormulario),
    atualizadoEm: asText(now),
    enviadoEm: statusFormulario === "Enviado" ? asText(now) : "",
    origem: "github-pages-funai",
    etapaAtual: currentStep,
    consultor: {
      nome: asText(getValue("consultorNome")),
      email: asText(getAuthorizedEmail()),
      areaEstudo: asText(getValue("areaEstudo"))
    },
    reivindicacao: {
      id: asText(getValue("reivindicacaoId")),
      nome: asText(getValue("nomeReivindicacao")),
      outrosNomes: asText(getValue("outrosNomes")),
      outrosNomesTexto: asText(getValue("outrosNomesTexto")),
      etnias,
      outraEtnia: asText(outrasEtnias.join(", ")),
      outrasEtnias,
      tipoDemanda: asList(getCheckedValues("tipoDemanda")),
      modalidadeConstituicao: asText(getValue("modalidadeConstituicao")),
      temJustificativaRevisao: asText(getValue("temJustificativaRevisao")),
      justificativaRevisao: asText(getValue("justificativaRevisao")),
      estado: asText(estados.join(", ")),
      estados,
      municipio: asText(municipios.join(", ")),
      municipios,
      coordenacaoRegional: asText(getValue("coordenacaoRegional")),
      temRetomada: asText(getValue("temRetomada")),
      detalhesRetomada: asText(getValue("detalhesRetomada"))
    },
    resumoProcesso: {
      descricao: asText(getValue("descricaoReivindicacao")),
      documentos,
      dataDocumento: asText(primeiroDocumento.dataDocumento),
      tipoDocumento: asText(primeiroDocumento.tipoDocumento),
      paginas: asText(primeiroDocumento.paginasDocumento),
      paginasDocumento: asText(primeiroDocumento.paginasDocumento),
      numeroSei: asText(primeiroDocumento.numeroSei),
      eventosAssuntos: asText(primeiroDocumento.eventosAssuntos),
      numeroProcessoDocumento: asText(primeiroDocumento.numeroProcessoDocumento)
    },
    statusProcesso: {
      estaJudicializado: asText(getValue("estaJudicializado")),
      motivacaoJudicializacao: asText(getMotivacaoJudicializacao()),
      tiposAcaoJudicial,
      acoesJudiciaisDetalhadas,
      classificacaoJudicializacao: asText(primeiraAcaoJudicial.tipo),
      classificacaoJudicializacaoOutros: tiposAcaoJudicial.includes("Outros") ? asText(getValue("classificacaoJudicializacaoOutros")) : "",
      acoesJudiciais: tiposAcaoJudicial,
      descricaoAcao: asText(primeiraAcaoJudicial.acpOutros),
      parteAutoraAcao: "",
      numeroProcessoSeiJudicial: asText(primeiraAcaoJudicial.numeroProcessoSei),
      numeroAcaoJudicial: asText(primeiraAcaoJudicial.numeroAcao),
      dataAcaoJudicial: asText(primeiraAcaoJudicial.data),
      detalhesJudicializacao: asText(primeiraAcaoJudicial.detalhesJudicializacao),
      temDecisao: asText(primeiraAcaoJudicial.temDecisaoJudicial),
      numeroDecisao: "",
      dataDecisao: "",
      sentenca: "",
      detalhesDecisao: asText(primeiraAcaoJudicial.detalhesDecisao),
      numeroProcessoJudicial: asText(primeiraAcaoJudicial.numeroAcao)
    },
    caracterizacaoArea: {
      localizacaoDemanda: asText(getValue("localizacaoDemanda")),
      coordenadas,
      coordenadasDetalhadas,
      latitude: asText(primeiraCoordenada.latitude),
      tipoCoordenada: asText(primeiraCoordenada.tipoCoordenada),
      outroFormatoCoordenada: asText(primeiraCoordenada.outroFormatoCoordenada),
      latitudeDirecao: asText(primeiraCoordenada.latitudeDirecao),
      longitude: asText(primeiraCoordenada.longitude),
      longitudeDirecao: asText(primeiraCoordenada.longitudeDirecao),
      coordenadaSedeMunicipio: asText(primeiraCoordenada.coordenadaSedeMunicipio),
      comentarioCoordenada: asText(primeiraCoordenada.comentarioCoordenada),
      temMapaCartografico: asText(getValue("temMapaCartografico")),
      mapasCartograficos,
      bioma: asList(getCheckedValues("bioma")),
      citaAldeiasComunidades: asText(getValue("citaAldeiasComunidades")),
      aldeiasComunidades: asText(getAldeiasComunidades().join(", ")),
      aldeiasComunidadesLista: asList(getAldeiasComunidades()),
      contextoUrbano: asText(getValue("contextoUrbano")),
      detalhesContextoUrbano: asText(getValue("detalhesContextoUrbano")),
      faixaFronteira: asText(getValue("faixaFronteira")),
      detalhesFaixaFronteira: asText(getValue("detalhesFaixaFronteira")),
      temRetomada: asText(getValue("temRetomada")),
      detalhesRetomada: asText(getValue("detalhesRetomada")),
      sobreposicoes: asText(getValue("sobreposicoes")),
      tiposSobreposicao: asList(getCheckedValues("tiposSobreposicao")),
      detalheUcFederal: asText(getValue("detalheUcFederal")),
      detalheUcEstadual: asText(getValue("detalheUcEstadual")),
      detalheUcMunicipal: asText(getValue("detalheUcMunicipal")),
      detalheGlebaFederal: asText(getValue("detalheGlebaFederal")),
      detalheGlebaEstadual: asText(getValue("detalheGlebaEstadual")),
      detalheTerritorioQuilombola: asText(getValue("detalheTerritorioQuilombola")),
      detalheProjetoAssentamento: asText(getValue("detalheProjetoAssentamento")),
      detalheProjetoAssentamentoAgroextrativista: asText(getValue("detalheProjetoAssentamentoAgroextrativista")),
      detalheProjetoDesenvolvimentoSustentavel: asText(getValue("detalheProjetoDesenvolvimentoSustentavel")),
      detalheProjetoAssentamentoFlorestal: asText(getValue("detalheProjetoAssentamentoFlorestal")),
      detalheOutrasSobreposicoes: asText(getValue("detalheOutrasSobreposicoes"))
    },
    ocupacaoIndigena: {
      indigenasArea: asText(getValue("indigenasArea")),
      tempoOcupacao: asText(getValue("tempoOcupacao")),
      dataReferenciaOcupacao: prepararDataParaPayload(getValue("dataReferenciaOcupacao")),
      vulnerabilidades: asList(getCheckedValues("vulnerabilidades")),
      outroCriterioVulnerabilidade: asText(getValue("outroCriterioVulnerabilidade")),
      detalhesVulnerabilidades: asList(getDetalhesVulnerabilidades()),
      fonteVulnerabilidade: asText(getValue("fonteVulnerabilidade")),
      dataReferenciaVulnerabilidade: prepararDataParaPayload(getPrimeiroDetalheVulnerabilidade().dataReferencia || getValue("dataReferenciaVulnerabilidade")),
      comunidadesTradicionais: asText(getValue("comunidadesTradicionais")),
      tiposComunidadeTradicional: asList(getSelectedComunidadesTradicionais()),
      detalhesComunidadesTradicionais: asList(getDetalhesComunidadesTradicionais()),
      descricaoComunidadeTradicional: asText(getValue("descricaoComunidadeTradicional")),
      dataReferenciaComunidadeTradicional: prepararDataParaPayload(getPrimeiroDetalheComunidadeTradicional().dataReferencia),
      conflitoInteretnico: asText(getValue("conflitoInteretnico")),
      tiposConflito: asList(getCheckedValues("tiposConflito")),
      detalhesConflitos,
      outroTipoConflito: asText(primeiroConflito.outroTipoConflito),
      envolvidosConflito: asText(primeiroConflito.envolvidos),
      motivoConflitoInteretnico: asText(primeiroConflito.descricao),
      etniaConflitoInteretnico: asText(primeiroConflito.etniaRelacionada),
      dataReferenciaConflitoInteretnico: prepararDataParaPayload(primeiroConflito.dataReferencia),
      fonteConflito: asText(primeiroConflito.fonte),
      povosIsolados: asText(getValue("povosIsolados")),
      detalhesPovosIsolados: asText(getValue("detalhesPovosIsolados")),
      reintegracaoPosse: asText(getValue("reintegracaoPosse")),
      descricaoReintegracaoPosse: asText(getValue("descricaoReintegracaoPosse"))
    }
  };
}

async function salvarRascunho() {
  cancelarAutosavePendente();
  const isDraftSave = true;
  validateRequiredFields(isDraftSave);
  await salvarFormulario("Rascunho", { automatico: false });
}

async function salvarFormulario(statusFormulario = "Rascunho", options = {}) {
  const automatico = Boolean(options.automatico);
  const isDraft = statusFormulario === "Rascunho";
  const actionButton = isDraft ? saveDraftBtn : submitBtn;
  const defaultText = isDraft ? "Salvar Rascunho" : "Enviar formulário";
  const loadingText = isDraft ? "Salvando..." : "Enviando...";

  if (isDraft && (envioFinalEmAndamento || isCurrentFormularioBlockedForDraft())) {
    if (automatico) setAutosaveStatus("Envio final iniciado. Rascunho bloqueado.", "success");
    return false;
  }

  if (!automatico && actionButton.disabled) return false;

  if (isDraft && !hasReivindicacaoId()) {
    if (automatico) {
      setAutosaveStatus("Rascunho não salvo: informe o ID da reivindicação.", "error");
      return false;
    }

    showRequiredReivindicacaoIdDialog({
      onConfirm: () => salvarFormulario("Rascunho", { automatico: false })
    });
    return false;
  }

  if (!getFormulario2ApiUrl(FORMULARIO2_ROUTES.receber)) {
    if (automatico) {
      setAutosaveStatus("Autosave não configurado.", "error");
      return false;
    }
    showMessage("Configure o endpoint de recebimento no arquivo js/config.local.js antes de salvar.", "error");
    return false;
  }

  const isUpdate = activePersistenceMode === "update";
  let payload;
  let payloadPowerAutomate;

  try {
    payload = normalizarPayloadParaPowerAutomate(buildPayload(statusFormulario));
    const formularioJsonValidation = validarFormularioJsonAntesDoEnvio(payload);
    updateFormularioJsonSizeMeter();

    if (!isDraft && !formularioJsonValidation.isValid) {
      showMessage(`Não foi possível enviar: FormularioJson incompleto. Blocos ausentes: ${formularioJsonValidation.camposAusentes.join(", ") || "JSON inválido"}.`, "error");
      return false;
    }

    payloadPowerAutomate = prepararPayloadPowerAutomate(payload);

    if (automatico) {
      const assinaturaAtual = criarAssinaturaPayload(payloadPowerAutomate);
      if (assinaturaAtual === ultimaAssinaturaAutosave) return false;
      ultimaAssinaturaAutosave = assinaturaAtual;
    }
  } catch (error) {
    console.error("Erro ao preparar payload", error);
    if (automatico) {
      setAutosaveStatus("Erro ao salvar automaticamente", "error");
      return false;
    }
    showMessage(isDraft ? "Erro ao salvar rascunho no SharePoint." : "Não foi possível enviar o formulário. Revise os campos e tente novamente.", "error");
    return false;
  }

  console.log(isUpdate ? "modo update" : "modo create");
  console.log("TIPOS DO PAYLOAD", {
    formularioJson: typeof payloadPowerAutomate.formularioJson,
    consultor: typeof payloadPowerAutomate.consultor,
    reivindicacao: typeof payloadPowerAutomate.reivindicacao,
    etniasEhArray: Array.isArray(payloadPowerAutomate.reivindicacao?.etnias),
    tipoDemandaEhArray: Array.isArray(payloadPowerAutomate.reivindicacao?.tipoDemanda),
    mapasEhArray: Array.isArray(payloadPowerAutomate.caracterizacaoArea?.mapasCartograficos)
  });
  if (!automatico) {
    saveDraftBtn.disabled = true;
    submitBtn.disabled = true;
    actionButton.textContent = loadingText;
  }

  try {
    await postFormulario2(FORMULARIO2_ROUTES.receber, payloadPowerAutomate);

    activePersistenceMode = "update";
    sessionStorage.setItem(ACTIVE_FORM_ID_KEY, payloadPowerAutomate.formularioId);

    if (automatico) return true;

    if (!isDraft) {
      sessionStorage.removeItem(ACTIVE_FORM_ID_KEY);
      showDashboard(getAuthorizedEmail(), "Seu formulário foi enviado com sucesso.");
      return true;
    }

    showMessage(isUpdate ? "Rascunho atualizado no SharePoint." : "Rascunho criado no SharePoint.", "success");
    return true;
  } catch (error) {
    console.error(error);
    if (automatico) {
      setAutosaveStatus("Erro ao salvar automaticamente", "error");
      return false;
    }
    showMessage(isDraft ? "Erro ao salvar rascunho no SharePoint." : "Não foi possível enviar o formulário. Verifique a URL do Power Automate e tente novamente.", "error");
  } finally {
    if (!automatico) {
      saveDraftBtn.disabled = false;
      submitBtn.disabled = false;
      actionButton.textContent = defaultText;
    }
  }
}

function salvarPdf() {
  gerarPdfFormulario();
}

function gerarPdfFormulario(dadosOrigem = null, nomeArquivo = "") {
  const tituloOriginal = document.title;
  if (nomeArquivo) document.title = nomeArquivo;
  window.addEventListener("afterprint", () => {
    document.title = tituloOriginal;
  }, { once: true });

  prepararImpressaoPdf(dadosOrigem);
  window.print();
}

function prepararImpressaoPdf(dadosOrigem = null) {
  document.querySelector(".pdf-print-root")?.remove();

  const dados = normalizarDadosParaPdf(dadosOrigem);
  const root = el("section", "pdf-print-root");
  const title = el("header", "pdf-cover pdf-section");
  title.append(
    el("h1", "", "Formulário - Resumo dos processos de reivindicação"),
    el("p", "pdf-footer-line", "CGID/DIDEM/FUNAI | 2026")
  );
  root.append(title);
  root.append(criarResumoPdf(dados));

  root.append(
    criarPdfSecao("1. Dados do consultor", [
      pdfField("Nome", dados.consultor?.nome),
      pdfField("E-mail", dados.consultor?.email),
      pdfField("Área de estudo", dados.consultor?.areaEstudo)
    ]),
    criarPdfSecao("2. Reivindicação", [
      pdfField("ID", dados.reivindicacao?.id),
      pdfField("Nome da reivindicação", dados.reivindicacao?.nome),
      pdfRadio("Há outros nomes da reivindicação citados no processo?", dados.reivindicacao?.outrosNomes, ["Sim", "Não"]),
      pdfField("Outros nomes", dados.reivindicacao?.outrosNomesTexto),
      pdfField("Etnia", asList(dados.reivindicacao?.etnias).join(", ")),
      pdfField("Outras etnias", asList(dados.reivindicacao?.outrasEtnias).join(", ")),
      pdfField("Tipo da demanda", asList(dados.reivindicacao?.tipoDemanda).join(", ")),
      pdfField("Modalidade de constituição", dados.reivindicacao?.modalidadeConstituicao),
      pdfRadio("Há justificativa para revisão de limites?", dados.reivindicacao?.temJustificativaRevisao, ["Sim", "Não", "Sem informação"]),
      pdfField("Justificativa da revisão", dados.reivindicacao?.justificativaRevisao),
      pdfField("Estado", asList(dados.reivindicacao?.estados).join(", ") || dados.reivindicacao?.estado),
      pdfField("Município", asList(dados.reivindicacao?.municipios).join(", ") || dados.reivindicacao?.municipio),
      pdfField("Coordenação Regional", dados.reivindicacao?.coordenacaoRegional),
      pdfRadio("Ação de retomada do território?", dados.reivindicacao?.temRetomada, ["Sim", "Não", "Sem informação"]),
      pdfField("Detalhes da retomada", dados.reivindicacao?.detalhesRetomada)
    ]),
    criarPdfSecao("3. Resumo do processo", [
      pdfField("Descrição da reivindicação", dados.resumoProcesso?.descricao),
      pdfTabela("Documentos", ["Data", "Tipo", "Páginas", "Assunto", "Nº SEI", "Nº do processo"], asList(dados.resumoProcesso?.documentos).map((item) => [
        formatarDataPdf(item.dataDocumento),
        item.tipoDocumento,
        item.paginasDocumento,
        item.eventosAssuntos,
        item.numeroSei,
        item.numeroProcessoDocumento
      ]))
    ]),
    criarPdfSecao("4. Status do processo", [
      pdfRadio("Está judicializado?", dados.statusProcesso?.estaJudicializado, ["Sim", "Não", "Sem informação"]),
      pdfField("Motivação da judicialização", dados.statusProcesso?.motivacaoJudicializacao),
      pdfField("Tipos de ação judicial", asList(dados.statusProcesso?.tiposAcaoJudicial).join(", ")),
      pdfTabela("Ações judiciais", ["Tipo", "Nº processo SEI", "Nº ação", "Data", "Detalhes", "Decisão", "Detalhes da decisão"], asList(dados.statusProcesso?.acoesJudiciaisDetalhadas).map((item) => [
        item.tipo,
        item.numeroProcessoSei,
        item.numeroAcao,
        formatarDataPdf(item.data),
        item.detalhesJudicializacao,
        item.temDecisaoJudicial,
        item.detalhesDecisao
      ]))
    ]),
    criarPdfSecao("5. Caracterização da área", [
      pdfField("Localização da demanda", dados.caracterizacaoArea?.localizacaoDemanda),
      pdfTabela("Coordenadas", ["Latitude", "Longitude", "Sede do município?", "Comentário"], asList(dados.caracterizacaoArea?.coordenadasDetalhadas).map((item) => [
        item.latitude,
        item.longitude,
        item.coordenadaSedeMunicipio,
        item.comentarioCoordenada
      ])),
      pdfRadio("Há mapa e material cartográfico nos processos?", dados.caracterizacaoArea?.temMapaCartografico, ["Sim", "Não", "Sem informação"]),
      pdfTabela("Mapas cartográficos", ["Nº SEI", "Página"], asList(dados.caracterizacaoArea?.mapasCartograficos).map((item) => [item.numeroSei, item.pagina])),
      pdfField("Bioma", asList(dados.caracterizacaoArea?.bioma).join(", ")),
      pdfRadio("Cita aldeias ou comunidades?", dados.caracterizacaoArea?.citaAldeiasComunidades, ["Sim", "Não", "Sem informação"]),
      pdfField("Aldeias/comunidades", asList(dados.caracterizacaoArea?.aldeiasComunidadesLista).join(", ") || dados.caracterizacaoArea?.aldeiasComunidades),
      pdfRadio("Contexto urbano?", dados.caracterizacaoArea?.contextoUrbano, ["Sim", "Não", "Sem informação"]),
      pdfField("Detalhes do contexto urbano", dados.caracterizacaoArea?.detalhesContextoUrbano),
      pdfRadio("Faixa de fronteira?", dados.caracterizacaoArea?.faixaFronteira, ["Sim", "Não", "Sem informação"]),
      pdfField("Detalhes da faixa de fronteira", dados.caracterizacaoArea?.detalhesFaixaFronteira),
      pdfRadio("Sobreposições?", dados.caracterizacaoArea?.sobreposicoes, ["Sim", "Não", "Sem informação"]),
      pdfField("Tipos de sobreposição", asList(dados.caracterizacaoArea?.tiposSobreposicao).join(", "))
    ]),
    criarPdfSecao("6. Situação da ocupação indígena", [
      pdfRadio("Indígenas estão na área reivindicada?", dados.ocupacaoIndigena?.indigenasArea, ["Sim", "Não", "Sem informação"]),
      pdfField("Tempo de ocupação", dados.ocupacaoIndigena?.tempoOcupacao),
      pdfField("Data do dado da ocupação", formatarDataPdf(dados.ocupacaoIndigena?.dataReferenciaOcupacao)),
      pdfField("Vulnerabilidades", asList(dados.ocupacaoIndigena?.vulnerabilidades).join(", ")),
      pdfField("Outro critério de vulnerabilidade", dados.ocupacaoIndigena?.outroCriterioVulnerabilidade),
      pdfTabela("Detalhes de vulnerabilidades", ["Critério", "Fonte", "Data"], asList(dados.ocupacaoIndigena?.detalhesVulnerabilidades).map((item) => [
        item.criterioDescricao ? `${item.criterio}: ${item.criterioDescricao}` : item.criterio,
        item.fonte,
        formatarDataPdf(item.dataReferencia)
      ])),
      pdfRadio("Há presença de outras comunidades tradicionais?", dados.ocupacaoIndigena?.comunidadesTradicionais, ["Sim", "Não", "Sem informação"]),
      pdfField("Tipos de comunidade tradicional", asList(dados.ocupacaoIndigena?.tiposComunidadeTradicional).join(", ")),
      pdfTabela("Comunidades tradicionais", ["Tipo", "Fonte", "Data"], asList(dados.ocupacaoIndigena?.detalhesComunidadesTradicionais).map((item) => [
        item.tipo,
        item.fonte,
        formatarDataPdf(item.dataReferencia)
      ])),
      pdfRadio("Há conflito na área reivindicada?", dados.ocupacaoIndigena?.conflitoInteretnico, ["Sim", "Não", "Sem informação"]),
      pdfField("Tipos de conflito", asList(dados.ocupacaoIndigena?.tiposConflito).join(", ")),
      pdfTabela("Conflitos", ["Tipo", "Descrição", "Data", "Envolvidos", "Etnia", "Fonte"], asList(dados.ocupacaoIndigena?.detalhesConflitos).map((item) => [
        item.outroTipoConflito ? `${item.tipo}: ${item.outroTipoConflito}` : item.tipo,
        item.descricao,
        formatarDataPdf(item.dataReferencia),
        item.envolvidos,
        formatConflictEthnicities(item),
        item.fonte
      ])),
      pdfRadio("Há indício de povos isolados?", dados.ocupacaoIndigena?.povosIsolados, ["Sim", "Não"]),
      pdfField("Detalhes de povos isolados", dados.ocupacaoIndigena?.detalhesPovosIsolados),
      pdfRadio("Há reintegração de posse?", dados.ocupacaoIndigena?.reintegracaoPosse, ["Sim", "Não", "Sem informação"]),
      pdfField("Descrição da reintegração de posse", dados.ocupacaoIndigena?.descricaoReintegracaoPosse),
    ]),
    criarAssinaturaGovPdf()
  );

  document.body.append(root);
  window.addEventListener("afterprint", () => root.remove(), { once: true });
}

function normalizarDadosParaPdf(dadosOrigem) {
  if (!dadosOrigem) {
    const payload = normalizarPayloadParaPowerAutomate(buildPayload("Enviado"));
    return typeof payload.formularioJson === "string"
      ? JSON.parse(payload.formularioJson)
      : payload.formularioJson;
  }

  const dadosConvertidos = converterJsonSerializadoEmObjeto(dadosOrigem);
  const formularioJson = extrairFormularioJson(dadosConvertidos);
  if (formularioJson) return formularioJson;

  if (
    dadosConvertidos?.consultor ||
    dadosConvertidos?.reivindicacao ||
    dadosConvertidos?.resumoProcesso ||
    dadosConvertidos?.statusProcesso ||
    dadosConvertidos?.caracterizacaoArea ||
    dadosConvertidos?.ocupacaoIndigena
  ) {
    return garantirTiposPayload({
      ...dadosConvertidos,
      formularioJson: dadosConvertidos
    });
  }

  return montarDadosLegadosParaPdf(flattenDraft(dadosConvertidos));
}

function montarDadosLegadosParaPdf(values) {
  return {
    consultor: {
      nome: values.consultorNome,
      email: values.consultorEmail,
      areaEstudo: values.areaEstudo
    },
    reivindicacao: {
      id: values.reivindicacaoId,
      nome: values.nomeReivindicacao,
      outrosNomes: values.outrosNomes,
      outrosNomesTexto: values.outrosNomesTexto,
      etnias: values.etnias,
      outrasEtnias: values.outrasEtnias,
      tipoDemanda: values.tipoDemanda,
      modalidadeConstituicao: values.modalidadeConstituicao,
      temJustificativaRevisao: values.temJustificativaRevisao,
      justificativaRevisao: values.justificativaRevisao,
      estados: values.estados,
      municipios: values.municipios,
      coordenacaoRegional: values.coordenacaoRegional,
      temRetomada: values.temRetomada,
      detalhesRetomada: values.detalhesRetomada
    },
    resumoProcesso: {
      descricao: values.descricaoReivindicacao,
      documentos: values.documentos
    },
    statusProcesso: {
      estaJudicializado: values.estaJudicializado,
      motivacaoJudicializacao: values.motivacaoJudicializacao,
      tiposAcaoJudicial: values.tiposAcaoJudicial,
      acoesJudiciaisDetalhadas: values.acoesJudiciaisDetalhadas
    },
    caracterizacaoArea: {
      localizacaoDemanda: values.localizacaoDemanda,
      coordenadasDetalhadas: values.coordenadas,
      temMapaCartografico: values.temMapaCartografico,
      mapasCartograficos: values.mapasCartograficos,
      bioma: values.bioma,
      citaAldeiasComunidades: values.citaAldeiasComunidades,
      aldeiasComunidadesLista: values.aldeiasComunidadesLista,
      aldeiasComunidades: values.aldeiasComunidades,
      contextoUrbano: values.contextoUrbano,
      detalhesContextoUrbano: values.detalhesContextoUrbano,
      faixaFronteira: values.faixaFronteira,
      detalhesFaixaFronteira: values.detalhesFaixaFronteira,
      sobreposicoes: values.sobreposicoes,
      tiposSobreposicao: values.tiposSobreposicao
    },
    ocupacaoIndigena: {
      indigenasArea: values.indigenasArea,
      tempoOcupacao: values.tempoOcupacao,
      dataReferenciaOcupacao: values.dataReferenciaOcupacao,
      vulnerabilidades: values.vulnerabilidades,
      outroCriterioVulnerabilidade: values.outroCriterioVulnerabilidade,
      detalhesVulnerabilidades: values.detalhesVulnerabilidades,
      comunidadesTradicionais: values.comunidadesTradicionais,
      tiposComunidadeTradicional: values.tiposComunidadeTradicional,
      detalhesComunidadesTradicionais: values.detalhesComunidadesTradicionais,
      conflitoInteretnico: values.conflitoInteretnico,
      tiposConflito: values.tiposConflito,
      detalhesConflitos: values.detalhesConflitos,
      povosIsolados: values.povosIsolados,
      detalhesPovosIsolados: values.detalhesPovosIsolados,
      reintegracaoPosse: values.reintegracaoPosse,
      descricaoReintegracaoPosse: values.descricaoReintegracaoPosse,
    }
  };
}

function criarPdfSecao(titulo, items) {
  const content = items.filter(Boolean);
  if (!content.length) return document.createDocumentFragment();
  const section = el("section", "pdf-section");
  const body = el("div", "pdf-section-body");
  body.append(...content);
  section.append(el("h2", "", titulo), body);
  return section;
}

function criarResumoPdf(dados) {
  return criarPdfSecao("Resumo do rascunho", [
    pdfField("ID", dados.reivindicacao?.id),
    pdfField("Nome da reivindicação", dados.reivindicacao?.nome),
    pdfField("Consultor", dados.consultor?.nome),
    pdfField("Área de estudo", dados.consultor?.areaEstudo),
    pdfField("Estado", asList(dados.reivindicacao?.estados).join(", ") || dados.reivindicacao?.estado),
    pdfField("Município", asList(dados.reivindicacao?.municipios).join(", ") || dados.reivindicacao?.municipio)
  ]);
}

function pdfField(label, value) {
  const text = asText(value);
  if (!text) return null;
  const row = el("div", text.length > 95 ? "pdf-field pdf-field-long" : "pdf-field");
  row.append(el("strong", "", label), el("span", "", text));
  return row;
}

function pdfRadio(label, value, options) {
  const selected = asText(value);
  if (!selected) return null;
  const row = el("div", "pdf-field pdf-radio");
  row.append(el("strong", "", label));
  options.forEach((option) => {
    row.append(el("span", "pdf-radio-option", `( ${selected === option ? "X" : " "} ) ${option}`));
  });
  return row;
}

function pdfTabela(title, headers, rows) {
  const cleanRows = rows
    .map((row) => row.map((cell) => asText(cell)))
    .filter((row) => row.some(Boolean));
  if (!cleanRows.length) return null;

  const wrapper = el("div", "pdf-table-wrap");
  const table = el("table", headers.length > 4 ? "pdf-table pdf-table-wide" : "pdf-table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headers.forEach((header) => headerRow.append(el("th", "", header)));
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  cleanRows.forEach((row) => {
    const tr = document.createElement("tr");
    headers.forEach((header, index) => {
      const cell = el("td", "", row[index] || "");
      cell.dataset.label = header;
      tr.append(cell);
    });
    tbody.append(tr);
  });

  table.append(thead, tbody);
  wrapper.append(el("h3", "", title), table);
  return wrapper;
}

function criarAssinaturaGovPdf() {
  const section = el("section", "pdf-section pdf-signature");
  section.append(
    el("h2", "", "ASSINATURA GOV.BR"),
    el("div", "pdf-signature-line", ""),
    el("p", "", "Assinatura eletrônica"),
    el("footer", "pdf-footer-line", "CGID/DIDEM/FUNAI | 2026")
  );
  return section;
}

function formatarDataPdf(value) {
  return converterDataParaBR(value);
}

function el(tagName, className = "", text = "") {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

async function saveDraft() {
  return salvarRascunho();
}

// Dashboard lists
async function listarRascunhos(email = getAuthorizedEmail()) {
  await listarRelatorios({
    title: "Meus rascunhos",
    route: FORMULARIO2_ROUTES.rascunhos,
    emptyMessage: "Nenhum rascunho encontrado.",
    mode: "draft",
    email
  });
}

async function listarEnviados() {
  await listarRelatorios({
    title: "Relatórios enviados",
    route: FORMULARIO2_ROUTES.enviados,
    emptyMessage: "Nenhum relatório enviado encontrado.",
    mode: "sent"
  });
}

async function listarRelatorios({ title, route, emptyMessage, mode = "draft", email = getAuthorizedEmail() }) {
  currentReportListMode = mode;
  showReportList(title, "Carregando...");

  if (!getFormulario2ApiUrl(route)) {
    showReportListMessage("Configure os endpoints do Formulário 2 no arquivo js/config.local.js.", "error");
    return;
  }

  try {
    const data = await postFormulario2(route, {
      consultor: {
        email
      }
    });
    const relatorios = normalizarListaRelatorios(data);
    if (!relatorios) throw new Error("Resposta sem lista de itens.");
    renderReportList(relatorios, emptyMessage);
  } catch (error) {
    showReportListMessage("Não foi possível carregar a lista.", "error");
  }
}

async function abrirRascunho(formularioId) {
  return abrirRelatorio(formularioId, "draft");
}

async function abrirRelatorioEnviado(formularioId) {
  return abrirRelatorio(formularioId, "sent");
}

async function abrirRelatorio(formularioId, mode = "draft") {
  return carregarFormulario(formularioId, mode);
}

async function carregarFormulario(formularioId, mode = "draft") {
  const resumo = getCachedReport(formularioId);
  if (!resumo) {
    showReportListMessage("Relatório não encontrado nesta lista.", "error");
    return;
  }

  const id = getReportFormularioId(resumo) || asText(formularioId);
  const expectedReivindicacaoId = getReportReivindicacaoId(resumo);
  const expectedConsultor = getReportConsultorIdentity(resumo);
  const selectionKey = getReportSelectionKey(resumo);
  if (extrairFormularioJson(resumo)) {
    showReportListMessage(mode === "sent" ? "Abrindo relatório enviado..." : "Abrindo rascunho...", "success");
    await abrirRelatorioSelecionado(resumo, id, mode);
    return;
  }

  if (!getFormulario2ApiUrl(FORMULARIO2_ROUTES.carregarRascunho)) {
    showReportListMessage("Configure os endpoints do Formulário 2 no arquivo js/config.local.js.", "error");
    return;
  }

  try {
    showReportListMessage(mode === "sent" ? "Carregando relatório enviado..." : "Carregando rascunho...", "success");
    const data = await postFormulario2(FORMULARIO2_ROUTES.carregarRascunho, {
      formularioId: id,
      reivindicacaoId: expectedReivindicacaoId,
      idReivindicacao: expectedReivindicacaoId,
      consultorIdentidade: expectedConsultor,
      chaveRelatorio: selectionKey,
      consultor: {
        email: getAuthorizedEmail()
      }
    });
    const relatorio = normalizarRascunhoCarregado(data, resumo);
    if (!relatorio) {
      showReportListMessage(mode === "sent" ? "Relatório enviado não encontrado." : "Rascunho não encontrado.", "error");
      return;
    }

    if (!relatorioCorrespondeAoResumo(relatorio, resumo)) {
      const loadedReivindicacaoId = getReportReivindicacaoId(relatorio) || "sem ID";
      showReportListMessage(`O relatório carregado não corresponde ao ID selecionado (${expectedReivindicacaoId || "sem ID"}). Recebido: ${loadedReivindicacaoId}.`, "error");
      return;
    }

    await abrirRelatorioSelecionado(relatorio, id, mode);
  } catch (error) {
    showReportListMessage("Não foi possível abrir o relatório.", "error");
  }
}

async function abrirRelatorioSelecionado(relatorio, fallbackFormularioId, mode = "draft") {
  currentFormularioId = getReportFormularioId(relatorio) || asText(fallbackFormularioId);
  sessionStorage.setItem(ACTIVE_FORM_ID_KEY, currentFormularioId);
  activePersistenceMode = "update";
  await openForm({ reset: true, mode: mode === "sent" ? "sent" : "edit" });
  preencherFormulario(relatorio);
  setFormViewMode(mode === "sent" ? "sent" : "edit");
  updateConditionals();
  if (mode === "sent") {
    renderSentFullView();
  } else {
    showStep(getFormularioStep(relatorio));
  }
}

function normalizarRascunhoCarregado(data, fallback) {
  if (Array.isArray(data)) return data[0] || fallback;
  if (data?.success === false) throw new Error("Fluxo retornou success=false.");
  if (data && Object.prototype.hasOwnProperty.call(data, "item")) return data.item;
  if (data?.relatorio) return data.relatorio;
  if (data?.rascunho) return data.rascunho;
  if (Array.isArray(data?.value)) return data.value[0] || fallback;
  if (data?.value && !Array.isArray(data.value)) return data.value;
  return data || fallback;
}

async function carregarRelatorio(id) {
  return abrirRelatorio(id, currentReportListMode);
}

function preencherFormulario(dados) {
  const formularioId = getReportFormularioId(dados);
  if (formularioId) {
    currentFormularioId = formularioId;
    sessionStorage.setItem(ACTIVE_FORM_ID_KEY, currentFormularioId);
    activePersistenceMode = "update";
  }

  const formularioJson = extrairFormularioJson(dados);
  if (formularioJson) {
    preencherFormularioPorJson(formularioJson);
  } else {
    restoreValues(flattenDraft(dados));
  }
  setAuthorizedEmail(getAuthorizedEmail());
}

function preencherFormularioPorJson(dados) {
  if (!dados || typeof dados !== "object") return;
  const formularioId = getReportFormularioId(dados);
  if (formularioId) {
    currentFormularioId = formularioId;
    sessionStorage.setItem(ACTIVE_FORM_ID_KEY, currentFormularioId);
    activePersistenceMode = "update";
  }

  restoreValues(flattenDraft(dados));
  updateConditionals();
}

function extrairFormularioJson(item) {
  const raw = item?.FormularioJson || item?.formularioJson;
  if (!raw) return null;
  if (typeof raw === "object") return raw;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("FormularioJson inválido.", error);
    return null;
  }
}

function getFormularioStep(item) {
  const formularioJson = extrairFormularioJson(item) || item;
  const step = Number(formularioJson?.etapaAtual);
  if (!Number.isInteger(step)) return 0;
  return Math.min(Math.max(step, 0), Math.max(steps.length - 1, 0));
}

/* antigo fluxo local mantido como alias de compatibilidade */
async function carregarRelatorioLocal(formularioId) {
  const relatorio = getCachedReport(formularioId);
  if (!relatorio) return;

  currentFormularioId = getReportFormularioId(relatorio) || asText(formularioId);
  sessionStorage.setItem(ACTIVE_FORM_ID_KEY, currentFormularioId);
  await openForm({ reset: true, mode: "edit" });
  preencherFormulario(relatorio);
  updateConditionals();
  showStep(0);
}

function showReportList(title, message = "") {
  reportListPanel.hidden = false;
  reportListTitle.textContent = title;
  reportList.innerHTML = "";
  if (reportListControls) reportListControls.hidden = currentReportListMode !== "sent";
  if (reportIdSearch) reportIdSearch.value = "";
  if (message) showReportListMessage(message, "success");
}

function hideReportList() {
  reportListPanel.hidden = true;
  reportList.innerHTML = "";
  if (reportListControls) reportListControls.hidden = true;
  if (reportIdSearch) reportIdSearch.value = "";
  reportListMessage.textContent = "";
  reportListMessage.className = "message";
}

function showReportListMessage(text, type) {
  reportListMessage.textContent = text;
  reportListMessage.className = `message is-visible ${type}`;
}

function showDashboardMessage(text, type) {
  if (!dashboardMessage) return;
  dashboardMessage.textContent = text;
  dashboardMessage.className = text ? `message is-visible ${type}` : "message";
}

function normalizarListaRelatorios(data) {
  if (Array.isArray(data)) return data;
  if (data?.success === false) throw new Error("Fluxo retornou success=false.");
  if (Array.isArray(data?.relatorios)) return data.relatorios;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.value)) return data.value;
  return null;
}

function renderReportList(relatorios, emptyMessage) {
  cachedReports = relatorios;
  reportList.innerHTML = "";

  if (currentReportListMode === "sent") {
    renderSentReportList(relatorios, emptyMessage);
    return;
  }

  if (!relatorios.length) {
    showReportListMessage(emptyMessage, "success");
    return;
  }

  reportListMessage.textContent = "";
  reportListMessage.className = "message";
  reportList.append(createDraftReportHeader());

  relatorios.forEach((relatorio) => {
    const reportKey = getReportSelectionKey(relatorio);
    const reivindicacaoId = getReportReivindicacaoId(relatorio) || "Sem ID";
    const nomeReivindicacao = getReportNomeReivindicacao(relatorio) || "Sem nome";
    const atualizadoEm = getReportAtualizadoEm(relatorio);
    const status = getReportStatus(relatorio) || "Rascunho";
    const row = document.createElement("div");
    const idButton = document.createElement("button");
    const name = document.createElement("span");
    const date = document.createElement("span");
    const statusText = document.createElement("span");
    const progress = createDraftProgress(getDraftCompletionPercent(relatorio));
    const action = document.createElement("button");

    row.className = "report-list-row";
    idButton.type = "button";
    idButton.className = "report-link";
    idButton.textContent = reivindicacaoId;
    idButton.addEventListener("click", () => {
      if (currentReportListMode === "sent") {
        abrirRelatorioEnviado(reportKey);
        return;
      }

      abrirRascunho(reportKey);
    });
    idButton.disabled = !reportKey;

    name.textContent = nomeReivindicacao;
    date.textContent = atualizadoEm;
    statusText.textContent = status;
    action.type = "button";
    action.className = "report-open-action";
    action.textContent = "Baixar PDF";
    action.disabled = !reportKey;
    action.addEventListener("click", () => baixarRascunhoPdf(reportKey));

    [
      [idButton, "ID"],
      [name, "Nome da reivindicação"],
      [date, "Atualizado em"],
      [statusText, "Status"],
      [progress, "Progresso"],
      [action, "A\u00e7\u00e3o"]
    ].forEach(([element, label]) => {
      element.dataset.label = label;
    });

    row.append(idButton, name, date, statusText, progress, action);
    reportList.append(row);
  });
}

async function baixarRascunhoPdf(reportKey) {
  const resumo = getCachedReport(reportKey);
  if (!resumo) {
    showReportListMessage("Rascunho n\u00e3o encontrado nesta lista.", "error");
    return;
  }

  try {
    showReportListMessage("Preparando PDF do rascunho...", "success");
    const relatorio = await carregarRelatorioCompletoDaLista(resumo, reportKey, "draft");
    const reivindicacaoId = getReportReivindicacaoId(relatorio) || getReportReivindicacaoId(resumo) || "rascunho";
    gerarPdfFormulario(relatorio, criarNomeArquivoPdf(reivindicacaoId));
    showReportListMessage("PDF pronto. Escolha salvar como PDF na janela de impress\u00e3o.", "success");
  } catch (error) {
    console.error(error);
    showReportListMessage("N\u00e3o foi poss\u00edvel baixar este rascunho.", "error");
  }
}

async function carregarRelatorioCompletoDaLista(resumo, formularioId, mode = "draft") {
  const id = getReportFormularioId(resumo) || asText(formularioId);
  const expectedReivindicacaoId = getReportReivindicacaoId(resumo);
  const expectedConsultor = getReportConsultorIdentity(resumo);
  const selectionKey = getReportSelectionKey(resumo);

  if (extrairFormularioJson(resumo)) return resumo;

  if (!getFormulario2ApiUrl(FORMULARIO2_ROUTES.carregarRascunho)) {
    throw new Error("Endpoint de carregamento não configurado.");
  }

  const data = await postFormulario2(FORMULARIO2_ROUTES.carregarRascunho, {
    formularioId: id,
    reivindicacaoId: expectedReivindicacaoId,
    idReivindicacao: expectedReivindicacaoId,
    consultorIdentidade: expectedConsultor,
    chaveRelatorio: selectionKey,
    consultor: {
      email: getAuthorizedEmail()
    }
  });
  const relatorio = normalizarRascunhoCarregado(data, resumo);
  if (!relatorio) {
    throw new Error(mode === "sent" ? "Relatório enviado não encontrado." : "Rascunho não encontrado.");
  }

  if (!relatorioCorrespondeAoResumo(relatorio, resumo)) {
    throw new Error(`Relat\u00f3rio carregado n\u00e3o corresponde ao rascunho selecionado (${mode}).`);
  }

  return relatorio;
}

function criarNomeArquivoPdf(reivindicacaoId) {
  const id = normalizeText(reivindicacaoId)
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "rascunho";
  return `rascunho-${id}`;
}

function handleSentReportSearch() {
  if (currentReportListMode !== "sent") return;
  renderSentReportList(getFilteredSentReports(), "Nenhum relatório enviado encontrado.");
}

function getFilteredSentReports() {
  const query = normalizeText(reportIdSearch?.value || "");
  if (!query) return cachedReports;
  return cachedReports.filter((relatorio) => normalizeText(getReportReivindicacaoId(relatorio)).includes(query));
}

function renderSentReportList(relatorios, emptyMessage) {
  reportList.innerHTML = "";

  if (!cachedReports.length) {
    showReportListMessage(emptyMessage, "success");
    return;
  }

  if (!relatorios.length) {
    showReportListMessage("Nenhum relatório encontrado para esse ID.", "error");
    return;
  }

  reportListMessage.textContent = "";
  reportListMessage.className = "message";
  reportList.append(createSentReportHeader());

  relatorios.forEach((relatorio) => {
    const reportKey = getReportSelectionKey(relatorio);
    const reivindicacaoId = getReportReivindicacaoId(relatorio) || "Sem ID";
    const nomeReivindicacao = getReportNomeReivindicacao(relatorio) || "Sem nome";
    const areaEstudo = getReportAreaEstudo(relatorio) || "Sem informação";
    const enviadoEm = getReportEnviadoEm(relatorio);
    const status = getReportStatus(relatorio) || "Enviado";
    const row = document.createElement("div");
    const idButton = createReportOpenButton(reivindicacaoId, reportKey);
    const name = document.createElement("span");
    const area = document.createElement("span");
    const date = document.createElement("span");
    const statusText = document.createElement("span");
    const action = document.createElement("button");

    row.className = "report-list-row sent-report-row";
    name.textContent = nomeReivindicacao;
    area.textContent = areaEstudo;
    date.textContent = enviadoEm;
    statusText.textContent = status;
    action.type = "button";
    action.className = "report-open-action";
    action.textContent = "Abrir";
    action.disabled = !reportKey;
    action.addEventListener("click", () => abrirRelatorioEnviado(reportKey));

    [
      [idButton, "ID"],
      [name, "Nome da reivindicação"],
      [area, "Área de estudo"],
      [date, "Data de envio"],
      [statusText, "Status"],
      [action, "Ação"]
    ].forEach(([element, label]) => {
      element.dataset.label = label;
    });

    row.append(idButton, name, area, date, statusText, action);
    reportList.append(row);
  });
}

function createSentReportHeader() {
  const header = document.createElement("div");
  header.className = "report-list-row report-list-header sent-report-row";
  ["ID", "Nome da reivindicação", "Área de estudo", "Data de envio", "Status", "Ação"].forEach((label) => {
    const item = document.createElement("strong");
    item.textContent = label;
    header.append(item);
  });
  return header;
}

function createDraftReportHeader() {
  const header = document.createElement("div");
  header.className = "report-list-row report-list-header";
  ["ID", "Nome da reivindicação", "Atualizado em", "Status", "Progresso", "A\u00e7\u00e3o"].forEach((label) => {
    const item = document.createElement("strong");
    item.textContent = label;
    header.append(item);
  });
  return header;
}

function createDraftProgress(percent) {
  const value = Math.min(Math.max(Number(percent) || 10, 10), 100);
  const wrapper = document.createElement("div");
  const meta = document.createElement("span");
  const track = document.createElement("div");
  const bar = document.createElement("div");

  wrapper.className = "draft-progress";
  meta.className = "draft-progress-value";
  track.className = "draft-progress-track";
  bar.className = "draft-progress-bar";

  meta.textContent = `${value}%`;
  track.setAttribute("aria-hidden", "true");
  bar.style.width = `${value}%`;

  track.append(bar);
  wrapper.append(meta, track);
  return wrapper;
}

function getDraftCompletionPercent(relatorio) {
  const formularioJson = extrairFormularioJson(relatorio);
  if (!formularioJson) return getStepCompletionPercent(getFormularioStep(relatorio));

  const fields = collectCompletionFields(formularioJson);
  if (!fields.length) return 10;

  const filledFields = fields.filter((field) => isCompletionValueFilled(field.value)).length;
  const percent = Math.ceil((filledFields / fields.length) * 100 / 10) * 10;
  return Math.min(Math.max(percent, 10), 100);
}

function getStepCompletionPercent(stepIndex) {
  if (!steps.length) return 10;
  const currentStepNumber = Math.min(Math.max(Number(stepIndex) || 0, 0), steps.length - 1) + 1;
  if (currentStepNumber === 1) return 10;
  if (currentStepNumber === steps.length) return 100;
  const percent = Math.ceil((currentStepNumber / steps.length) * 100 / 10) * 10;
  return Math.min(Math.max(percent, 10), 100);
}

function collectCompletionFields(source, path = []) {
  const ignoredKeys = new Set([
    "tokenSecreto",
    "formularioId",
    "statusFormulario",
    "atualizadoEm",
    "enviadoEm",
    "origem",
    "etapaAtual"
  ]);

  if (Array.isArray(source)) {
    if (!source.length) return [{ path, value: "" }];
    return source.flatMap((item, index) => collectCompletionFields(item, [...path, index]));
  }

  if (source && typeof source === "object") {
    return Object.entries(source).flatMap(([key, value]) => {
      if (ignoredKeys.has(key)) return [];
      return collectCompletionFields(value, [...path, key]);
    });
  }

  return [{ path, value: source }];
}

function isCompletionValueFilled(value) {
  if (Array.isArray(value)) return value.some(isCompletionValueFilled);
  if (value && typeof value === "object") return Object.values(value).some(isCompletionValueFilled);
  return asText(value).trim().length > 0;
}

function createReportOpenButton(label, reportKey) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "report-link";
  button.textContent = label;
  button.disabled = !reportKey;
  button.addEventListener("click", () => abrirRelatorioEnviado(reportKey));
  return button;
}

function getCachedReport(id) {
  const targetId = asText(id);
  return cachedReports.find((relatorio) => {
    const reportKey = getReportSelectionKey(relatorio);
    if (reportKey && reportKey === targetId) return true;

    const formId = getReportFormularioId(relatorio);
    return formId && formId === targetId;
  });
}

function getReportSelectionKey(relatorio) {
  const reivindicacaoId = normalizeKeyPart(getReportReivindicacaoId(relatorio));
  const consultor = normalizeKeyPart(getReportConsultorIdentity(relatorio));
  if (reivindicacaoId && consultor) return `${reivindicacaoId}::${consultor}`;

  const formularioId = normalizeKeyPart(getReportFormularioId(relatorio));
  return formularioId ? `formulario::${formularioId}` : "";
}

function getReportConsultorIdentity(relatorio) {
  const formularioJson = extrairFormularioJson(relatorio);
  return asText(
    formularioJson?.consultor?.email ||
    relatorio.consultor?.email ||
    relatorio.ConsultorEmail ||
    relatorio.consultorEmail ||
    formularioJson?.consultor?.nome ||
    relatorio.consultor?.nome ||
    relatorio.ConsultorNome ||
    relatorio.Title ||
    relatorio.consultorNome
  );
}

function normalizeKeyPart(value) {
  return normalizeText(asText(value)).trim();
}

function getReportFormularioId(relatorio) {
  const formularioJson = extrairFormularioJson(relatorio);
  return asText(formularioJson?.formularioId || relatorio.formularioId || relatorio.FormularioId);
}

function relatorioCorrespondeAoResumo(relatorio, resumo) {
  const resumoFormularioId = getReportFormularioId(resumo);
  const relatorioFormularioId = getReportFormularioId(relatorio);
  if (resumoFormularioId && relatorioFormularioId && resumoFormularioId !== relatorioFormularioId) return false;

  const resumoReivindicacaoId = getReportReivindicacaoId(resumo);
  const relatorioReivindicacaoId = getReportReivindicacaoId(relatorio);
  if (resumoReivindicacaoId && relatorioReivindicacaoId && resumoReivindicacaoId !== relatorioReivindicacaoId) return false;

  return true;
}

function getReportReivindicacaoId(relatorio) {
  const formularioJson = extrairFormularioJson(relatorio);
  return asText(formularioJson?.reivindicacao?.id || relatorio.reivindicacao?.id || relatorio.ReivindicacaoId || relatorio.field_2 || relatorio.reivindicacaoId);
}

function getReportNomeReivindicacao(relatorio) {
  const formularioJson = extrairFormularioJson(relatorio);
  return asText(formularioJson?.reivindicacao?.nome || relatorio.reivindicacao?.nome || relatorio.NomeReivindicacao || relatorio.field_3 || relatorio.nomeReivindicacao || relatorio.titulo);
}

function getReportAtualizadoEm(relatorio) {
  return asText(relatorio.Modified || relatorio.AtualizadoEm || relatorio.enviadoEm || relatorio.EnviadoEm || relatorio.atualizadoEm || relatorio.modificadoEm);
}

function getReportAreaEstudo(relatorio) {
  const formularioJson = extrairFormularioJson(relatorio);
  return asText(formularioJson?.consultor?.areaEstudo || relatorio.consultor?.areaEstudo || relatorio.AreaEstudo || relatorio.field_1 || relatorio.areaEstudo);
}

function getReportEnviadoEm(relatorio) {
  const formularioJson = extrairFormularioJson(relatorio);
  return asText(relatorio.EnviadoEm || relatorio.enviadoEm || formularioJson?.enviadoEm || relatorio.Modified || relatorio.AtualizadoEm || relatorio.atualizadoEm);
}

function getReportStatus(relatorio) {
  const formularioJson = extrairFormularioJson(relatorio);
  return asText(relatorio.statusFormulario || relatorio.StatusFormulario || formularioJson?.statusFormulario);
}

function restoreValues(values) {
  const etnias = asListOrSplit(values.etnias);
  const outrasEtnias = asListOrSplit(values.outrasEtnias || values.outraEtnia);
  const estados = asListOrSplit(values.estados);
  const municipios = asListOrSplit(values.municipios);
  const comunidadesTradicionais = asListOrSplit(values.tiposComunidadeTradicional);
  const aldeiasComunidadesLista = asListOrSplit(values.aldeiasComunidadesLista || values.aldeiasComunidades);

  if (etnias.length) {
    selectedEtnias = etnias;
    renderEtniaChips();
  }

  if (outrasEtnias.length) {
    selectedOutrasEtnias = outrasEtnias;
    renderOutraEtniaChips();
  }

  if (estados.length) {
    selectedEstados = estados;
    renderEstadoChips();
    populateMunicipioOptions();
  }

  if (municipios.length) {
    selectedMunicipios = municipios;
    renderMunicipioChips();
  }

  if (comunidadesTradicionais.length) {
    selectedComunidadesTradicionais = comunidadesTradicionais;
    renderComunidadeTradicionalChips();
    populateComunidadeTradicionalOptions();
  }

  const detalhesConflitos = normalizeDetalhesConflitos(values.detalhesConflitos, values);
  const tiposConflito = asListOrSplit(values.tiposConflito).length
    ? asListOrSplit(values.tiposConflito)
    : detalhesConflitos.map((item) => item.tipo).filter(Boolean);
  form.querySelectorAll('input[name="tiposConflito"]').forEach((field) => {
    field.checked = tiposConflito.includes(field.value);
  });

  if (aldeiasComunidadesLista.length) {
    restoreAldeiaFields(aldeiasComunidadesLista);
  }

  const documentos = normalizeDocumentos(values.documentos);
  restoreDocumentoRows(documentos);
  if (!documentos.length) restoreLegacyDocumentoRow(values);
  const coordenadas = asList(values.coordenadasDetalhadas || values.coordenadas);
  restoreCoordenadaRows(coordenadas);
  if (!coordenadas.length) restoreLegacyCoordenadaRow(values);
  restoreMapaRows(values.mapasCartograficos);
  restoreAcoesJudiciaisDetalhadas(values);
  restoreDetalhesVulnerabilidades(values.detalhesVulnerabilidades);
  renderComunidadeTradicionalDetalhes(values.detalhesComunidadesTradicionais);

  Object.entries(values).forEach(([name, value]) => {
    if (["etnias", "outrasEtnias", "outraEtnia", "estados", "municipios", "tiposComunidadeTradicional", "detalhesComunidadesTradicionais", "tiposAcaoJudicial", "acoesJudiciaisDetalhadas", "acoesJudiciais", "classificacaoJudicializacao", "classificacaoJudicializacaoOutros", "descricaoAcao", "numeroProcessoSeiJudicial", "numeroAcaoJudicial", "dataAcaoJudicial", "detalhesJudicializacao", "temDecisao", "numeroDecisao", "dataDecisao", "sentenca", "detalhesDecisao", "numeroProcessoJudicial", "processosAnalisados", "numerosProcesso", "descricaoProcessosAnalisados", "numeroSeiProcessoAnalisado", "descricaoProcessoAnalisado", "aldeiasComunidades", "aldeiasComunidadesLista", "documentos", "coordenadas", "mapasCartograficos", "detalhesVulnerabilidades", "detalhesConflitos", "tiposConflito", "outroTipoConflito", "envolvidosConflito", "motivoConflitoInteretnico", "etniaConflitoInteretnico", "dataReferenciaConflitoInteretnico", "fonteConflito", "dataDocumento", "tipoDocumento", "paginasDocumento", "numeroSei", "numeroProcessoDocumento", "eventosAssuntos", "tipoCoordenada", "outroFormatoCoordenada", "latitude", "latitudeDirecao", "longitude", "longitudeDirecao", "coordenadaSedeMunicipio", "comentarioCoordenada", "numeroSeiMapa", "paginaMapa"].includes(name)) return;
    if (value === undefined) return;

    const element = form.elements[name];
    if (!element) return;

    const fieldList = element instanceof RadioNodeList ? Array.from(element) : [element];

    fieldList.forEach((field) => {
      if (field.type === "checkbox") {
        field.checked = asListOrSplit(value).includes(field.value);
      } else if (field.type === "radio") {
        field.checked = field.value === value;
      } else if (field.type === "date") {
        field.value = normalizeDateForInput(value);
      } else if (field.tagName === "SELECT") {
        const hasOption = Array.from(field.options).some((option) => option.value === value || option.textContent === value);
        field.value = hasOption ? value || "" : "";
      } else {
        field.value = shouldDisplayDateAsBrazil(name) ? converterDataParaBR(value) : value || "";
      }
    });
  });

  renderDetalhesConflitos(detalhesConflitos);
  updateDescricaoReivindicacaoCounter();
}

function shouldDisplayDateAsBrazil(name) {
  return [
    "dataAcaoJudicial",
    "dataDecisao",
    "dataReferenciaOcupacao",
    "dataVulnerabilidadeItem",
    "dataComunidadeTradicional"
  ].includes(name);
}

function flattenDraft(draft) {
  return {
    consultorEmail: pickField(draft, directValue(() => draft.consultor?.email), "ConsultorEmail", "consultorEmail"),
    consultorNome: pickField(draft, directValue(() => draft.consultor?.nome), "ConsultorNome", "Title", "consultorNome"),
    areaEstudo: pickField(draft, directValue(() => draft.consultor?.areaEstudo), "AreaEstudo", "field_1", "areaEstudo"),
    reivindicacaoId: pickField(draft, directValue(() => draft.reivindicacao?.id), "ReivindicacaoId", "field_2", "reivindicacaoId"),
    nomeReivindicacao: pickField(draft, directValue(() => draft.reivindicacao?.nome), "NomeReivindicacao", "field_3", "nomeReivindicacao"),
    outrosNomes: pickField(draft, directValue(() => draft.reivindicacao?.outrosNomes), "OutrosNomes", "field_4", "outrosNomes"),
    outrosNomesTexto: pickField(draft, directValue(() => draft.reivindicacao?.outrosNomesTexto), "OutrosNomesTexto", "field_5", "outrosNomesTexto"),
    etnias: asListOrSplit(pickField(draft, directValue(() => draft.reivindicacao?.etnias), "Etnias", "field_9", "etnias")),
    outraEtnia: pickField(draft, directValue(() => draft.reivindicacao?.outraEtnia), "OutraEtnia", "field_10", "outraEtnia"),
    outrasEtnias: asListOrSplit(draft.reivindicacao?.outrasEtnias || draft.reivindicacao?.outraEtnia),
    tipoDemanda: asListOrSplit(pickField(draft, directValue(() => draft.reivindicacao?.tipoDemanda), "TipoDemanda", "field_11", "tipoDemanda")),
    modalidadeConstituicao: pickField(draft, directValue(() => draft.reivindicacao?.modalidadeConstituicao), "ModalidadeConstituicao", "field_12", "modalidadeConstituicao"),
    temJustificativaRevisao: pickField(draft, directValue(() => draft.reivindicacao?.temJustificativaRevisao), "TemJustificativaRevisao", "temJustificativaRevisao"),
    justificativaRevisao: pickField(draft, directValue(() => draft.reivindicacao?.justificativaRevisao), "JustificativaRevisao", "field_13", "justificativaRevisao"),
    estados: asListOrSplit(pickField(draft, directValue(() => draft.reivindicacao?.estados), "Estados", "field_14", "estados", directValue(() => draft.reivindicacao?.estado), "estado")),
    municipios: asListOrSplit(pickField(draft, directValue(() => draft.reivindicacao?.municipios), "Municipios", "field_15", "municipios", directValue(() => draft.reivindicacao?.municipio), "municipio")),
    coordenacaoRegional: pickField(draft, directValue(() => draft.reivindicacao?.coordenacaoRegional), "CoordenacaoRegional", "field_16", "coordenacaoRegional"),
    temRetomada: pickField(draft, directValue(() => draft.caracterizacaoArea?.temRetomada), directValue(() => draft.reivindicacao?.temRetomada), "TemRetomada", "field_17", "temRetomada"),
    detalhesRetomada: pickField(draft, directValue(() => draft.caracterizacaoArea?.detalhesRetomada), directValue(() => draft.reivindicacao?.detalhesRetomada), "DetalhesRetomada", "field_18", "detalhesRetomada"),
    descricaoReivindicacao: draft.resumoProcesso?.descricao,
    documentos: normalizeDocumentos(draft.resumoProcesso?.documentos || draft.Documentos || draft.documentos),
    dataDocumento: draft.resumoProcesso?.dataDocumento,
    tipoDocumento: draft.resumoProcesso?.tipoDocumento,
    paginasDocumento: draft.resumoProcesso?.paginasDocumento || draft.resumoProcesso?.paginaDocumento || draft.resumoProcesso?.paginas,
    numeroSei: draft.resumoProcesso?.numeroSei,
    eventosAssuntos: draft.resumoProcesso?.eventosAssuntos,
    estaJudicializado: normalizeEstaJudicializado(draft.statusProcesso?.estaJudicializado),
    motivacaoJudicializacao: draft.statusProcesso?.motivacaoJudicializacao,
    tiposAcaoJudicial: normalizeTiposAcaoJudicial(draft.statusProcesso?.tiposAcaoJudicial || draft.statusProcesso?.classificacaoJudicializacao || draft.statusProcesso?.acoesJudiciais || draft.statusProcesso?.motivacaoJudicializacao),
    acoesJudiciaisDetalhadas: normalizeAcoesJudiciaisDetalhadas(draft.statusProcesso?.acoesJudiciaisDetalhadas),
    classificacaoJudicializacao: draft.statusProcesso?.classificacaoJudicializacao,
    classificacaoJudicializacaoOutros: draft.statusProcesso?.classificacaoJudicializacaoOutros,
    acoesJudiciais: draft.statusProcesso?.acoesJudiciais,
    descricaoAcao: draft.statusProcesso?.descricaoAcao,
    parteAutoraAcao: draft.statusProcesso?.parteAutoraAcao,
    numeroProcessoSeiJudicial: draft.statusProcesso?.numeroProcessoSeiJudicial,
    numeroAcaoJudicial: draft.statusProcesso?.numeroAcaoJudicial,
    dataAcaoJudicial: draft.statusProcesso?.dataAcaoJudicial,
    detalhesJudicializacao: draft.statusProcesso?.detalhesJudicializacao,
    temDecisao: draft.statusProcesso?.temDecisao,
    numeroDecisao: draft.statusProcesso?.numeroDecisao,
    dataDecisao: draft.statusProcesso?.dataDecisao,
    sentenca: draft.statusProcesso?.sentenca,
    detalhesDecisao: draft.statusProcesso?.detalhesDecisao,
    numeroProcessoJudicial: draft.statusProcesso?.numeroProcessoJudicial,
    localizacaoDemanda: draft.caracterizacaoArea?.localizacaoDemanda,
    coordenadas: normalizeCoordenadas(draft.caracterizacaoArea?.coordenadasDetalhadas || draft.caracterizacaoArea?.coordenadas || draft.Coordenadas || draft.coordenadas),
    tipoCoordenada: draft.caracterizacaoArea?.tipoCoordenada,
    outroFormatoCoordenada: draft.caracterizacaoArea?.outroFormatoCoordenada,
    latitude: draft.caracterizacaoArea?.latitude,
    latitudeDirecao: draft.caracterizacaoArea?.latitudeDirecao,
    longitude: draft.caracterizacaoArea?.longitude,
    longitudeDirecao: draft.caracterizacaoArea?.longitudeDirecao,
    coordenadaSedeMunicipio: draft.caracterizacaoArea?.coordenadaSedeMunicipio,
    comentarioCoordenada: draft.caracterizacaoArea?.comentarioCoordenada,
    temMapaCartografico: draft.caracterizacaoArea?.temMapaCartografico,
    mapasCartograficos: normalizeMapasCartograficos(draft.caracterizacaoArea?.mapasCartograficos || draft.MapasCartograficos || draft.mapasCartograficos),
    bioma: draft.caracterizacaoArea?.bioma,
    citaAldeiasComunidades: draft.caracterizacaoArea?.citaAldeiasComunidades,
    aldeiasComunidades: draft.caracterizacaoArea?.aldeiasComunidades,
    aldeiasComunidadesLista: asListOrSplit(draft.caracterizacaoArea?.aldeiasComunidadesLista || draft.caracterizacaoArea?.aldeiasComunidades),
    contextoUrbano: draft.caracterizacaoArea?.contextoUrbano,
    detalhesContextoUrbano: draft.caracterizacaoArea?.detalhesContextoUrbano,
    faixaFronteira: draft.caracterizacaoArea?.faixaFronteira,
    detalhesFaixaFronteira: draft.caracterizacaoArea?.detalhesFaixaFronteira,
    sobreposicoes: draft.caracterizacaoArea?.sobreposicoes,
    tiposSobreposicao: draft.caracterizacaoArea?.tiposSobreposicao,
    detalheUcFederal: draft.caracterizacaoArea?.detalheUcFederal,
    detalheUcEstadual: draft.caracterizacaoArea?.detalheUcEstadual,
    detalheUcMunicipal: draft.caracterizacaoArea?.detalheUcMunicipal,
    detalheGlebaFederal: draft.caracterizacaoArea?.detalheGlebaFederal,
    detalheGlebaEstadual: draft.caracterizacaoArea?.detalheGlebaEstadual,
    detalheTerritorioQuilombola: draft.caracterizacaoArea?.detalheTerritorioQuilombola,
    detalheProjetoAssentamento: draft.caracterizacaoArea?.detalheProjetoAssentamento,
    detalheProjetoAssentamentoAgroextrativista: draft.caracterizacaoArea?.detalheProjetoAssentamentoAgroextrativista,
    detalheProjetoDesenvolvimentoSustentavel: draft.caracterizacaoArea?.detalheProjetoDesenvolvimentoSustentavel,
    detalheProjetoAssentamentoFlorestal: draft.caracterizacaoArea?.detalheProjetoAssentamentoFlorestal,
    detalheOutrasSobreposicoes: draft.caracterizacaoArea?.detalheOutrasSobreposicoes,
    indigenasArea: draft.ocupacaoIndigena?.indigenasArea,
    tempoOcupacao: draft.ocupacaoIndigena?.tempoOcupacao,
    dataReferenciaOcupacao: draft.ocupacaoIndigena?.dataReferenciaOcupacao,
    vulnerabilidades: draft.ocupacaoIndigena?.vulnerabilidades,
    outroCriterioVulnerabilidade: draft.ocupacaoIndigena?.outroCriterioVulnerabilidade || getOutroCriterioVulnerabilidade(draft.ocupacaoIndigena?.detalhesVulnerabilidades),
    detalhesVulnerabilidades: normalizeDetalhesVulnerabilidades(draft.ocupacaoIndigena?.detalhesVulnerabilidades),
    fonteVulnerabilidade: draft.ocupacaoIndigena?.fonteVulnerabilidade,
    dataReferenciaVulnerabilidade: draft.ocupacaoIndigena?.dataReferenciaVulnerabilidade,
    comunidadesTradicionais: draft.ocupacaoIndigena?.comunidadesTradicionais,
    tiposComunidadeTradicional: asListOrSplit(draft.ocupacaoIndigena?.tiposComunidadeTradicional),
    detalhesComunidadesTradicionais: normalizeDetalhesComunidadesTradicionais(draft.ocupacaoIndigena?.detalhesComunidadesTradicionais),
    descricaoComunidadeTradicional: draft.ocupacaoIndigena?.descricaoComunidadeTradicional,
    dataReferenciaComunidadeTradicional: draft.ocupacaoIndigena?.dataReferenciaComunidadeTradicional,
    conflitoInteretnico: draft.ocupacaoIndigena?.conflitoInteretnico,
    tiposConflito: asListOrSplit(draft.ocupacaoIndigena?.tiposConflito),
    detalhesConflitos: normalizeDetalhesConflitos(draft.ocupacaoIndigena?.detalhesConflitos, draft.ocupacaoIndigena),
    outroTipoConflito: draft.ocupacaoIndigena?.outroTipoConflito,
    envolvidosConflito: draft.ocupacaoIndigena?.envolvidosConflito,
    motivoConflitoInteretnico: draft.ocupacaoIndigena?.motivoConflitoInteretnico,
    etniaConflitoInteretnico: draft.ocupacaoIndigena?.etniaConflitoInteretnico,
    dataReferenciaConflitoInteretnico: draft.ocupacaoIndigena?.dataReferenciaConflitoInteretnico,
    fonteConflito: draft.ocupacaoIndigena?.fonteConflito,
    povosIsolados: draft.ocupacaoIndigena?.povosIsolados,
    detalhesPovosIsolados: draft.ocupacaoIndigena?.detalhesPovosIsolados,
    reintegracaoPosse: draft.ocupacaoIndigena?.reintegracaoPosse,
    descricaoReintegracaoPosse: draft.ocupacaoIndigena?.descricaoReintegracaoPosse,
  };
}

function splitLegacyList(value) {
  return asText(value)
    .split(",")
    .map((item) => asText(item).trim())
    .filter(Boolean);
}

function directValue(getValue) {
  return {
    isDirectValue: true,
    getValue
  };
}

function pickField(source, ...candidates) {
  for (const candidate of candidates) {
    const value = candidate?.isDirectValue ? candidate.getValue() : source?.[candidate];
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return "";
}

function getAuthorizedEmail() {
  return getStoredAuthorizedEmail() || getValue("consultorEmail");
}

function getCurrentFormularioId() {
  if (!currentFormularioId) currentFormularioId = sessionStorage.getItem(ACTIVE_FORM_ID_KEY) || "";
  if (!currentFormularioId) throw new Error("Formulário sem formularioId ativo.");
  sessionStorage.setItem(ACTIVE_FORM_ID_KEY, currentFormularioId);
  return currentFormularioId;
}

function createFormularioId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `form-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function asText(value) {
  return value == null ? "" : repararTextoEncoding(String(value));
}

function repararTextoEncoding(texto) {
  const textoOriginal = String(texto || "");
  if (!temSinalDeMojibake(textoOriginal)) return textoOriginal;

  try {
    const bytes = Uint8Array.from(textoOriginal, (char) => char.charCodeAt(0) & 0xff);
    const textoCorrigido = new TextDecoder("utf-8").decode(bytes);
    return pontuarMojibake(textoCorrigido) < pontuarMojibake(textoOriginal) ? textoCorrigido : textoOriginal;
  } catch (error) {
    return textoOriginal;
  }
}

function temSinalDeMojibake(texto) {
  return /Ã.|Â.|â[\u0080-\u00bf]|�/.test(texto);
}

function pontuarMojibake(texto) {
  const ocorrencias = texto.match(/Ã.|Â.|â[\u0080-\u00bf]|�/g);
  return ocorrencias ? ocorrencias.length : 0;
}

function normalizarTextoParaPowerAutomate(valor) {
  if (valor === null || valor === undefined) return "";
  if (Array.isArray(valor) || typeof valor === "object") return repararEncodingEmValor(valor);
  return asText(valor);
}

function normalizarPayloadParaPowerAutomate(payload) {
  const normalizado = {
    ...payload,
    reivindicacao: { ...(payload.reivindicacao || {}) },
    resumoProcesso: { ...(payload.resumoProcesso || {}) },
    statusProcesso: { ...(payload.statusProcesso || {}) },
    caracterizacaoArea: { ...(payload.caracterizacaoArea || {}) },
    ocupacaoIndigena: { ...(payload.ocupacaoIndigena || {}) }
  };

  const camposTexto = [
    ["resumoProcesso", "descricao"],
    ["resumoProcesso", "descricaoReivindicacao"],
    ["statusProcesso", "motivacaoJudicializacao"],
    ["statusProcesso", "descricaoAcao"],
    ["statusProcesso", "detalhesJudicializacao"],
    ["statusProcesso", "detalhesDecisao"],
    ["caracterizacaoArea", "localizacaoDemanda"],
    ["caracterizacaoArea", "detalhesContextoUrbano"],
    ["caracterizacaoArea", "detalhesFaixaFronteira"],
    ["caracterizacaoArea", "detalhesRetomada"],
    ["ocupacaoIndigena", "motivoConflitoInteretnico"],
    ["ocupacaoIndigena", "envolvidosConflito"],
    ["ocupacaoIndigena", "etniaConflitoInteretnico"],
    ["ocupacaoIndigena", "dataReferenciaConflitoInteretnico"],
    ["ocupacaoIndigena", "fonteConflito"],
    ["ocupacaoIndigena", "descricaoReintegracaoPosse"]
  ];

  camposTexto.forEach(([bloco, campo]) => {
    if (!normalizado[bloco] || !(campo in normalizado[bloco])) return;
    normalizado[bloco][campo] = normalizarTextoParaPowerAutomate(normalizado[bloco][campo]);
  });

  return normalizado;
}

function prepararPayloadPowerAutomate(payload) {
  const payloadNormalizado = converterJsonSerializadoEmObjeto({
    ...payload,
    formularioJson: converterJsonSerializadoEmObjeto(payload.formularioJson),
    dados: converterJsonSerializadoEmObjeto(payload.dados),
    payload: converterJsonSerializadoEmObjeto(payload.payload),
    consultor: converterJsonSerializadoEmObjeto(payload.consultor),
    reivindicacao: converterJsonSerializadoEmObjeto(payload.reivindicacao),
    resumoProcesso: converterJsonSerializadoEmObjeto(payload.resumoProcesso),
    statusProcesso: converterJsonSerializadoEmObjeto(payload.statusProcesso),
    caracterizacaoArea: converterJsonSerializadoEmObjeto(payload.caracterizacaoArea),
    ocupacaoIndigena: converterJsonSerializadoEmObjeto(payload.ocupacaoIndigena)
  });

  return {
    ...payloadNormalizado,
    formularioJson: serializarFormularioJsonParaPowerAutomate(payloadNormalizado.formularioJson)
  };
}

function serializarFormularioJsonParaPowerAutomate(value) {
  if (typeof value === "string") return value;
  return JSON.stringify(value || {});
}

function converterJsonSerializadoEmObjeto(value) {
  if (typeof value === "string") {
    const text = value.trim();
    if (!text || !/^[{\[]/.test(text)) return asText(value);

    try {
      return converterJsonSerializadoEmObjeto(JSON.parse(text));
    } catch (error) {
      return asText(value);
    }
  }

  if (Array.isArray(value)) return value.map(converterJsonSerializadoEmObjeto);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, converterJsonSerializadoEmObjeto(item)])
    );
  }

  return value;
}

function criarAssinaturaPayload(payload) {
  return JSON.stringify(removerCamposVolateisDoPayload(payload));
}

function removerCamposVolateisDoPayload(value, key = "") {
  if (Array.isArray(value)) return value.map((item) => removerCamposVolateisDoPayload(item));

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([entryKey]) => !["atualizadoEm", "enviadoEm"].includes(entryKey))
        .map(([entryKey, item]) => [entryKey, removerCamposVolateisDoPayload(item, entryKey)])
    );
  }

  if (["atualizadoEm", "enviadoEm"].includes(key)) return "";
  return value;
}

function asList(value) {
  return Array.isArray(value) ? value.map(repararEncodingEmValor).filter(isListValueFilled) : [];
}

function asListOrSplit(value) {
  if (Array.isArray(value)) return value.map(repararEncodingEmValor).filter(isListValueFilled);
  return splitLegacyList(value);
}

function repararEncodingEmValor(value) {
  if (value == null) return value;
  if (typeof value === "string") return asText(value);
  if (Array.isArray(value)) return value.map(repararEncodingEmValor);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, repararEncodingEmValor(item)])
    );
  }
  return value;
}

function isListValueFilled(value) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

async function readJsonIfAvailable(response) {
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return null;

  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function getFormulario2ApiUrl(route) {
  return String(FORMULARIO2_ENDPOINTS[route] || "").trim();
}

async function postFormulario2(route, payload) {
  const endpointUrl = getFormulario2ApiUrl(route);
  if (!endpointUrl) {
    throw new Error("Endpoint do Formulário 2 não configurado.");
  }

  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  console.log(response.status, response.statusText);

  const data = await readJsonIfAvailable(response);
  if (!response.ok) throw new Error(`Falha na API do Formulario 2: ${response.status}`);
  if (data?.success === false) throw new Error("Fluxo retornou success=false.");

  return data;
}

function getStoredAuthorizedEmail() {
  return sessionStorage.getItem(AUTHORIZED_EMAIL_KEY) || "";
}

function storeAuthorizedEmail(email) {
  sessionStorage.setItem(AUTHORIZED_EMAIL_KEY, email);
}

function startAccessSession() {
  sessionStorage.setItem(ACCESS_SESSION_KEY, createFormularioId());
}

function hasActiveSession() {
  return Boolean(sessionStorage.getItem(ACCESS_SESSION_KEY));
}

function getValue(name) {
  const field = form.elements[name];
  if (!field) return "";
  return String(field.value || "").trim();
}

function converterDataParaISO(dataBr) {
  const text = asText(dataBr).trim();
  if (!text) return "";

  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate && isDataValida(text)) {
    const value = `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
    console.log("data enviada ISO", value);
    return value;
  }

  const brazilDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilDate && isDataValida(text)) {
    const value = `${brazilDate[3]}-${brazilDate[2]}-${brazilDate[1]}`;
    console.log("data enviada ISO", value);
    return value;
  }

  return "";
}

function validarDataISO(valor) {
  const text = asText(valor).trim();
  if (!text) return "";

  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!isoDate) return "";

  return isDataValida(text) ? text : "";
}

function prepararDataParaPayload(valor) {
  return validarDataISO(converterDataParaISO(valor));
}

function converterDataParaBR(dataIso) {
  const text = asText(dataIso).trim();
  if (!text) return "";

  const brazilDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilDate) {
    console.log("data exibida BR", text);
    return text;
  }

  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    const value = `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
    console.log("data exibida BR", value);
    return value;
  }

  return text;
}

function formatDateToBrazil(value) {
  return converterDataParaBR(value);
}

function normalizeDateForInput(value) {
  const text = asText(value).trim();
  if (!text) return "";
  const brazilDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilDate) return `${brazilDate[3]}-${brazilDate[2]}-${brazilDate[1]}`;

  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

  return "";
}

function isDataValida(valor) {
  const text = asText(valor).trim();
  if (!text) return false;

  let year;
  let month;
  let day;
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const brazilDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (isoDate) {
    year = Number(isoDate[1]);
    month = Number(isoDate[2]);
    day = Number(isoDate[3]);
  } else if (brazilDate) {
    day = Number(brazilDate[1]);
    month = Number(brazilDate[2]);
    year = Number(brazilDate[3]);
  } else {
    return false;
  }

  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;
}

function getCheckedValues(name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((field) => field.value);
}

function populateEtniaOptions() {
  renderDatalistOptions(etniaOptions, allEtnias, selectedEtnias);
}

async function loadEtniaData() {
  try {
    const response = await fetch(ETNIAS_CSV_URL);
    if (!response.ok) throw new Error(`Falha ao carregar ${ETNIAS_CSV_URL}`);

    const csvText = await response.text();
    allEtnias = parseEtniasCsv(csvText);
    populateEtniaOptions();
  } catch (error) {
    allEtnias = ["Outros"];
    etniaInput.placeholder = "Não foi possível carregar etnias";
    populateEtniaOptions();
  }
}

function parseEtniasCsv(csvText) {
  const [, ...dataRows] = parseDelimitedRows(csvText, ",");
  const etnias = dataRows.map((row) => asText(row[0]).trim()).filter(Boolean);
  return Array.from(new Set(etnias)).sort(sortPortuguese);
}

async function loadMunicipioData() {
  try {
    const response = await fetch(MUNICIPIOS_CSV_URL);
    if (!response.ok) throw new Error(`Falha ao carregar ${MUNICIPIOS_CSV_URL}`);

    const csvText = await response.text();
    municipiosPorEstado = parseMunicipiosCsv(csvText);
    allEstados = Array.from(municipiosPorEstado.keys()).sort(sortPortuguese);
    populateEstadoOptions();
    populateMunicipioOptions();
  } catch (error) {
    estadoInput.placeholder = "Não foi possível carregar estados";
    municipioInput.placeholder = "Não foi possível carregar municípios";
    populateMunicipioOptions();
  }
}

function parseMunicipiosCsv(csvText) {
  const rows = parseDelimitedRows(csvText, ";");
  const [, ...dataRows] = rows;
  const grouped = new Map();

  dataRows.forEach((row) => {
    const municipio = asText(row[0]).trim();
    const estado = asText(row[1]).trim();
    if (!municipio || !estado) return;
    if (!grouped.has(estado)) grouped.set(estado, new Set());
    grouped.get(estado).add(municipio);
  });

  return new Map(
    Array.from(grouped.entries()).map(([estado, municipios]) => [
      estado,
      Array.from(municipios).sort(sortPortuguese)
    ])
  );
}

function parseDelimitedRows(text, delimiter) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && nextChar === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function sortPortuguese(a, b) {
  return a.localeCompare(b, "pt-BR");
}

function getComunidadesTradicionais() {
  return COMUNIDADES_TRADICIONAIS.map(asText);
}

function renderDatalistOptions(datalist, options, selectedValues = []) {
  if (!datalist) return;

  const selectedSet = new Set(selectedValues.map(asText));
  datalist.innerHTML = "";
  options.map(asText).filter(Boolean).forEach((value) => {
    if (selectedSet.has(value)) return;

    const option = document.createElement("option");
    option.value = value;
    datalist.append(option);
  });
}

function findSelectableValue(options, value) {
  const normalizedValue = asText(value).trim();
  if (!normalizedValue) return "";
  return options.map(asText).find((option) => option === normalizedValue) || "";
}

function populateEstadoOptions() {
  renderDatalistOptions(estadoOptions, allEstados, selectedEstados);
}

function populateMunicipioOptions() {
  const municipios = getAvailableMunicipios();
  renderDatalistOptions(municipioOptions, municipios, selectedMunicipios);

  const hasEstados = selectedEstados.length > 0;
  municipioInput.disabled = !hasEstados;
  addMunicipioBtn.disabled = !hasEstados;
  municipioInput.placeholder = hasEstados ? "Localizar municípios" : "Selecione um estado primeiro";
}

function getAvailableMunicipios() {
  const selectedSet = new Set();
  selectedEstados.forEach((estado) => {
    const municipios = municipiosPorEstado.get(estado) || [];
    municipios.forEach((municipio) => selectedSet.add(municipio));
  });

  return Array.from(selectedSet).sort(sortPortuguese);
}

function handleEtniaKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSelectedEtnia();
}

function handleOutraEtniaKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSelectedOutraEtnia();
}

function addSelectedEtnia() {
  const value = findSelectableValue(allEtnias, etniaInput.value);
  if (!value || selectedEtnias.includes(value)) return;

  selectedEtnias.push(value);
  etniaInput.value = "";
  renderEtniaChips();
  populateEtniaOptions();
  updateConditionals();
  clearResolvedValidationErrors();
}

function removeSelectedEtnia(event) {
  const button = event.target.closest("button[data-etnia]");
  if (!button) return;

  const value = asText(button.dataset.etnia);
  selectedEtnias = selectedEtnias.filter((etnia) => asText(etnia) !== value);
  renderEtniaChips();
  populateEtniaOptions();
  updateConditionals();
  clearResolvedValidationErrors();
}

function renderEtniaChips() {
  etniaChips.innerHTML = "";
  selectedEtnias = selectedEtnias.map(asText).filter(Boolean);
  selectedEtnias.forEach((etnia) => {
    const chip = document.createElement("span");
    const removeButton = document.createElement("button");

    chip.className = "chip";
    chip.append(document.createTextNode(etnia));
    removeButton.type = "button";
    removeButton.dataset.etnia = etnia;
    removeButton.setAttribute("aria-label", `Remover ${etnia}`);
    removeButton.textContent = "×";
    chip.append(removeButton);
    etniaChips.append(chip);
  });
}

function getSelectedEtnias() {
  return selectedEtnias.map(asText).filter(Boolean);
}

function addSelectedOutraEtnia() {
  const value = asText(outraEtniaInput.value).trim();
  if (!value || selectedOutrasEtnias.includes(value)) return;

  selectedOutrasEtnias.push(value);
  outraEtniaInput.value = "";
  renderOutraEtniaChips();
  clearResolvedValidationErrors();
}

function removeSelectedOutraEtnia(event) {
  const button = event.target.closest("button[data-outra-etnia]");
  if (!button) return;

  const value = asText(button.dataset.outraEtnia);
  selectedOutrasEtnias = selectedOutrasEtnias.filter((etnia) => asText(etnia) !== value);
  renderOutraEtniaChips();
  clearResolvedValidationErrors();
}

function renderOutraEtniaChips() {
  renderChips(outraEtniaChips, selectedOutrasEtnias, "outraEtnia", "Remover outra etnia");
}

function getSelectedOutrasEtnias() {
  return selectedOutrasEtnias.map(asText).filter(Boolean);
}

function handleEstadoKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSelectedEstado();
}

function addSelectedEstado() {
  const value = findSelectableValue(allEstados, estadoInput.value);
  if (!value || selectedEstados.includes(value)) return;

  selectedEstados.push(value);
  estadoInput.value = "";
  renderEstadoChips();
  populateEstadoOptions();
  pruneSelectedMunicipios();
  populateMunicipioOptions();
  clearResolvedValidationErrors();
}

function removeSelectedEstado(event) {
  const button = event.target.closest("button[data-estado]");
  if (!button) return;

  const value = asText(button.dataset.estado);
  selectedEstados = selectedEstados.filter((estado) => asText(estado) !== value);
  renderEstadoChips();
  populateEstadoOptions();
  pruneSelectedMunicipios();
  populateMunicipioOptions();
  clearResolvedValidationErrors();
}

function renderEstadoChips() {
  renderChips(estadoChips, selectedEstados, "estado", "Remover estado");
}

function getSelectedEstados() {
  return selectedEstados.map(asText).filter(Boolean);
}

function handleMunicipioKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSelectedMunicipio();
}

function addSelectedMunicipio() {
  const municipios = getAvailableMunicipios();
  const value = findSelectableValue(municipios, municipioInput.value);
  if (!value || selectedMunicipios.includes(value)) return;

  selectedMunicipios.push(value);
  municipioInput.value = "";
  renderMunicipioChips();
  populateMunicipioOptions();
  clearResolvedValidationErrors();
}

function removeSelectedMunicipio(event) {
  const button = event.target.closest("button[data-municipio]");
  if (!button) return;

  const value = asText(button.dataset.municipio);
  selectedMunicipios = selectedMunicipios.filter((municipio) => asText(municipio) !== value);
  renderMunicipioChips();
  populateMunicipioOptions();
  clearResolvedValidationErrors();
}

function renderMunicipioChips() {
  renderChips(municipioChips, selectedMunicipios, "municipio", "Remover município");
}

function getSelectedMunicipios() {
  return selectedMunicipios.map(asText).filter(Boolean);
}

function populateComunidadeTradicionalOptions() {
  renderDatalistOptions(comunidadeTradicionalOptions, getComunidadesTradicionais(), selectedComunidadesTradicionais);
}

function handleComunidadeTradicionalKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSelectedComunidadeTradicional();
}

function addSelectedComunidadeTradicional() {
  const value = findSelectableValue(getComunidadesTradicionais(), comunidadeTradicionalInput.value);
  if (!value || selectedComunidadesTradicionais.includes(value)) return;

  selectedComunidadesTradicionais.push(value);
  comunidadeTradicionalInput.value = "";
  renderComunidadeTradicionalChips();
  populateComunidadeTradicionalOptions();
  renderComunidadeTradicionalDetalhes();
  updateConditionals();
}

function removeSelectedComunidadeTradicional(event) {
  const button = event.target.closest("button[data-comunidade-tradicional]");
  if (!button) return;

  const value = asText(button.dataset.comunidadeTradicional);
  selectedComunidadesTradicionais = selectedComunidadesTradicionais.filter((item) => asText(item) !== value);
  renderComunidadeTradicionalChips();
  populateComunidadeTradicionalOptions();
  renderComunidadeTradicionalDetalhes();
  updateConditionals();
}

function renderComunidadeTradicionalChips() {
  renderChips(comunidadeTradicionalChips, selectedComunidadesTradicionais, "comunidadeTradicional", "Remover comunidade tradicional");
}

function getSelectedComunidadesTradicionais() {
  return selectedComunidadesTradicionais.map(asText).filter(Boolean);
}

function renderComunidadeTradicionalDetalhes(existingDetails = []) {
  const previous = new Map(getDetalhesComunidadesTradicionais().map((item) => [item.tipo, item]));
  normalizeDetalhesComunidadesTradicionais(existingDetails).forEach((item) => previous.set(item.tipo, item));

  comunidadeTradicionalDetalhes.innerHTML = "";
  if (!selectedComunidadesTradicionais.length) return;

  const header = document.createElement("div");
  header.className = "community-detail-row header";
  header.innerHTML = "<strong>Comunidade</strong><strong>Fonte do dado</strong><strong>De quando é o dado?</strong>";
  comunidadeTradicionalDetalhes.append(header);

  selectedComunidadesTradicionais.forEach((tipo) => {
    const detail = previous.get(tipo) || {};
    const row = document.createElement("div");
    row.className = "community-detail-row";
    row.dataset.communityDetail = tipo;
    row.innerHTML = `
      <span>${tipo}</span>
      <input name="fonteComunidadeTradicional" data-community-source="${tipo}" type="text" placeholder="Documento de origem">
      <input name="dataComunidadeTradicional" data-community-date="${tipo}" type="text" inputmode="numeric" placeholder="dd/mm/aaaa">
    `;
    row.querySelector("[data-community-source]").value = asText(detail.fonte);
    row.querySelector("[data-community-date]").value = converterDataParaBR(detail.dataReferencia);
    comunidadeTradicionalDetalhes.append(row);
  });
}

function getDetalhesComunidadesTradicionais() {
  return Array.from(comunidadeTradicionalDetalhes.querySelectorAll("[data-community-detail]"))
    .map((row) => {
      const tipo = row.dataset.communityDetail;
      const fonte = asText(row.querySelector("[data-community-source]")?.value);
      const dataReferencia = prepararDataParaPayload(row.querySelector("[data-community-date]")?.value);
      return { tipo, fonte, dataReferencia };
    })
    .filter((item) => item.tipo);
}

function getPrimeiroDetalheComunidadeTradicional() {
  return getDetalhesComunidadesTradicionais()[0] || {};
}

function renderDetalhesConflitos(existingDetails = []) {
  const container = document.getElementById("detalhesConflitos");
  if (!container) return;

  const previous = new Map(getDetalhesConflitos().map((item) => [item.tipo, item]));
  normalizeDetalhesConflitos(existingDetails).forEach((item) => previous.set(item.tipo, item));
  const selected = getValue("conflitoInteretnico") === "Sim" ? getCheckedValues("tiposConflito") : [];

  container.innerHTML = "";
  if (!selected.length) return;

  selected.forEach((tipo) => {
    const detail = previous.get(tipo) || {};
    const card = document.createElement("section");
    card.className = "conflict-detail-card";
    card.dataset.conflictDetail = tipo;
    card.innerHTML = `
      <h4>${tipo}</h4>
      <div class="conflict-detail-grid">
        <label class="conditional conflict-other-type">
          Qual outro tipo?
          <input data-conflict-other-type type="text" placeholder="Descreva o tipo de conflito">
        </label>
        <label>
          Descreva
          <input data-conflict-description type="text" placeholder="Descreva">
        </label>
        <label>
          De quando é o dado?
          <input data-conflict-reference type="text" inputmode="numeric" placeholder="dd/mm/aaaa">
        </label>
        <label>
          Envolvidos
          <input data-conflict-involved type="text" placeholder="Informe os envolvidos">
        </label>
        <div class="multi-autocomplete conflict-ethnicity-field">
          Etnia relacionada
          <div class="autocomplete-row">
            <input data-conflict-ethnicity type="text" list="etniaOptions" placeholder="Localizar etnia">
            <button type="button" class="icon-button" data-add-conflict-ethnicity aria-label="Adicionar etnia relacionada">+</button>
          </div>
          <div class="chips" data-conflict-ethnicity-chips aria-live="polite"></div>
        </div>
        <label>
          Fonte do dado
          <input data-conflict-source type="text" placeholder="Documento de onde veio a informação">
        </label>
      </div>
    `;

    card.querySelector(".conflict-other-type").classList.toggle("is-visible", tipo === "Outro");
    card.querySelector("[data-conflict-other-type]").value = asText(detail.outroTipoConflito);
    card.querySelector("[data-conflict-description]").value = asText(detail.descricao);
    card.querySelector("[data-conflict-reference]").value = converterDataParaBR(detail.dataReferencia);
    card.querySelector("[data-conflict-involved]").value = asText(detail.envolvidos);
    renderConflictEthnicityChips(card, getConflictEthnicityValues(detail));
    card.querySelector("[data-conflict-source]").value = asText(detail.fonte);
    container.append(card);
  });
}

function getDetalhesConflitos() {
  return Array.from(document.querySelectorAll("[data-conflict-detail]"))
    .map((card) => {
      const etniasRelacionadas = getConflictEthnicitiesFromCard(card);
      return {
        tipo: asText(card.dataset.conflictDetail),
        outroTipoConflito: asText(card.querySelector("[data-conflict-other-type]")?.value),
        descricao: asText(card.querySelector("[data-conflict-description]")?.value),
        dataReferencia: prepararDataParaPayload(card.querySelector("[data-conflict-reference]")?.value),
        envolvidos: asText(card.querySelector("[data-conflict-involved]")?.value),
        etniaRelacionada: asText(etniasRelacionadas.join(", ")),
        etniasRelacionadas,
        fonte: asText(card.querySelector("[data-conflict-source]")?.value)
      };
    })
    .filter((item) => item.tipo);
}

function normalizeDetalhesConflitos(value, legacy = {}) {
  let detalhes = [];

  if (Array.isArray(value)) {
    detalhes = value;
  } else if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      detalhes = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      detalhes = [];
    }
  }

  detalhes = detalhes
    .map((item) => ({
      tipo: asText(item?.tipo),
      outroTipoConflito: asText(item?.outroTipoConflito || item?.outroTipo || item?.tipoOutro),
      descricao: asText(item?.descricao || item?.motivoConflitoInteretnico),
      dataReferencia: prepararDataParaPayload(item?.dataReferencia || item?.dataReferenciaConflitoInteretnico),
      envolvidos: asText(item?.envolvidos || item?.envolvidosConflito),
      etniasRelacionadas: getConflictEthnicityValues(item),
      etniaRelacionada: formatConflictEthnicities(item),
      fonte: asText(item?.fonte || item?.fonteConflito)
    }))
    .filter((item) => item.tipo);

  if (detalhes.length) return detalhes;

  const tipos = asListOrSplit(legacy.tiposConflito);
  if (!tipos.length && !legacy.motivoConflitoInteretnico && !legacy.envolvidosConflito && !legacy.fonteConflito) return [];

  return (tipos.length ? tipos : ["Interétnico"]).map((tipo, index) => ({
    tipo,
    outroTipoConflito: tipo === "Outro" ? asText(legacy.outroTipoConflito) : "",
    descricao: index === 0 ? asText(legacy.motivoConflitoInteretnico) : "",
    dataReferencia: index === 0 ? prepararDataParaPayload(legacy.dataReferenciaConflitoInteretnico) : "",
    envolvidos: index === 0 ? asText(legacy.envolvidosConflito) : "",
    etniaRelacionada: index === 0 ? asText(legacy.etniaConflitoInteretnico) : "",
    etniasRelacionadas: index === 0 ? asListOrSplit(legacy.etniaConflitoInteretnico) : [],
    fonte: index === 0 ? asText(legacy.fonteConflito) : ""
  }));
}

function getConflictEthnicityValues(item = {}) {
  const candidates = [
    item.etniasRelacionadas,
    item.etniasRelacionada,
    item.etniaRelacionada,
    item.etniaConflitoInteretnico
  ];

  for (const candidate of candidates) {
    const values = asListOrSplit(candidate);
    if (values.length) return values;
  }

  return [];
}

function formatConflictEthnicities(item = {}) {
  return getConflictEthnicityValues(item).join(", ");
}

function getConflictEthnicitiesFromCard(card) {
  return Array.from(card.querySelectorAll("[data-remove-conflict-ethnicity]"))
    .map((button) => asText(button.dataset.removeConflictEthnicity))
    .filter(Boolean);
}

function renderConflictEthnicityChips(card, values) {
  const container = card.querySelector("[data-conflict-ethnicity-chips]");
  if (!container) return;

  container.innerHTML = "";
  asListOrSplit(values).forEach((value) => {
    const displayValue = asText(value);
    const chip = document.createElement("span");
    const removeButton = document.createElement("button");

    chip.className = "chip";
    chip.append(document.createTextNode(displayValue));
    removeButton.type = "button";
    removeButton.dataset.removeConflictEthnicity = displayValue;
    removeButton.setAttribute("aria-label", `Remover etnia relacionada ${displayValue}`);
    removeButton.textContent = "×";
    chip.append(removeButton);
    container.append(chip);
  });
}

function addConflictEthnicity(card) {
  const input = card?.querySelector("[data-conflict-ethnicity]");
  if (!input) return;

  const value = findSelectableValue(allEtnias, input.value);
  const selected = getConflictEthnicitiesFromCard(card);
  if (!value || selected.includes(value)) return;

  selected.push(value);
  input.value = "";
  renderConflictEthnicityChips(card, selected);
  updateFormularioJsonSizeMeter();
  clearResolvedValidationErrors();
  agendarAutosave();
}

function handleConflictEthnicityClick(event) {
  const addButton = event.target.closest("[data-add-conflict-ethnicity]");
  if (addButton) {
    addConflictEthnicity(addButton.closest("[data-conflict-detail]"));
    return;
  }

  const removeButton = event.target.closest("[data-remove-conflict-ethnicity]");
  if (!removeButton) return;

  const card = removeButton.closest("[data-conflict-detail]");
  const value = asText(removeButton.dataset.removeConflictEthnicity);
  const selected = getConflictEthnicitiesFromCard(card).filter((item) => asText(item) !== value);
  renderConflictEthnicityChips(card, selected);
  updateFormularioJsonSizeMeter();
  clearResolvedValidationErrors();
  agendarAutosave();
}

function handleConflictEthnicityKeydown(event) {
  if (!event.target.matches("[data-conflict-ethnicity]")) return;
  if (event.key !== "Enter") return;

  event.preventDefault();
  addConflictEthnicity(event.target.closest("[data-conflict-detail]"));
}

function pruneSelectedMunicipios() {
  const availableMunicipios = getAvailableMunicipios();
  selectedMunicipios = selectedMunicipios.filter((municipio) => availableMunicipios.includes(municipio));
  renderMunicipioChips();
}

function renderChips(container, values, dataName, ariaPrefix) {
  container.innerHTML = "";
  values.map(asText).filter(Boolean).forEach((value) => {
    const chip = document.createElement("span");
    const removeButton = document.createElement("button");

    chip.className = "chip";
    chip.append(document.createTextNode(value));
    removeButton.type = "button";
    removeButton.dataset[dataName] = value;
    removeButton.setAttribute("aria-label", `${ariaPrefix} ${value}`);
    removeButton.textContent = "×";
    chip.append(removeButton);
    container.append(chip);
  });
  updateFormularioJsonSizeMeter();
}

function handleDocumentoTableClick(event) {
  const removeButton = event.target.closest(".remove-documento-btn");
  if (removeButton) {
    removeDocumentoRow(removeButton.closest(".document-row"));
    return;
  }

  const addButton = event.target.closest(".add-documento-row-btn");
  if (addButton) addDocumentoRow();
}

function addDocumentoRow(documento = {}, shouldFocus = true) {
  const row = document.createElement("tr");
  row.className = "document-row";
  row.innerHTML = `
    <td><input name="dataDocumento" type="text" inputmode="numeric" placeholder="dd/mm/aaaa" aria-label="Data"></td>
    <td><input name="tipoDocumento" type="text" placeholder="Tipo de documento" aria-label="Tipo de documento"></td>
    <td><input name="paginasDocumento" type="text" placeholder="Página" aria-label="Página para o caso de dossiê/volume digitalizado"></td>
    <td><input name="eventosAssuntos" type="text" placeholder="Digite o assunto" aria-label="Assunto"></td>
    <td><input name="numeroSei" type="text" placeholder="Nº SEI" aria-label="Nº SEI"></td>
    <td><input name="numeroProcessoDocumento" type="text" placeholder="Nº do processo" aria-label="Nº do processo"></td>
    <td class="document-actions">
      <button type="button" class="icon-button remove-documento-btn" aria-label="Remover documento">×</button>
      <button type="button" class="icon-button add-documento-row-btn" aria-label="Adicionar documento">+</button>
    </td>
  `;
  documentosTableBody.append(row);
  setDocumentoRowValues(row, documento);
  updateFormularioJsonSizeMeter();
  if (shouldFocus) row.querySelector("input, textarea")?.focus();
}

function removeDocumentoRow(row) {
  if (!row) return;
  const rows = Array.from(documentosTableBody.querySelectorAll(".document-row"));
  if (rows.length > 1) {
    row.remove();
    updateFormularioJsonSizeMeter();
    return;
  }

  setDocumentoRowValues(row, {});
  updateFormularioJsonSizeMeter();
}

function resetDocumentoRows() {
  const rows = Array.from(documentosTableBody.querySelectorAll(".document-row"));
  if (!rows.length) return;
  rows.slice(1).forEach((row) => row.remove());
  setDocumentoRowValues(rows[0], {});
}

function restoreDocumentoRows(documentos = []) {
  const values = normalizeDocumentos(documentos);
  resetDocumentoRows();
  if (!values.length) return;

  const [first, ...rest] = values;
  const firstRow = documentosTableBody.querySelector(".document-row");
  setDocumentoRowValues(firstRow, first);
  rest.forEach((documento) => addDocumentoRow(documento, false));
}

function restoreLegacyDocumentoRow(values) {
  const documento = {
    dataDocumento: values.dataDocumento,
    tipoDocumento: values.tipoDocumento,
    paginasDocumento: values.paginasDocumento || values.paginas,
    numeroSei: values.numeroSei,
    numeroProcessoDocumento: values.numeroProcessoDocumento || values.numeroProcesso,
    eventosAssuntos: values.eventosAssuntos
  };

  if (Object.values(documento).some(Boolean)) {
    setDocumentoRowValues(documentosTableBody.querySelector(".document-row"), documento);
  }
}

function setDocumentoRowValues(row, documento) {
  if (!row) return;
  const normalizado = normalizeDocumentoItem(documento);
  row.querySelector("[name='dataDocumento']").value = converterDataParaBR(normalizado.dataDocumento);
  row.querySelector("[name='tipoDocumento']").value = asText(normalizado.tipoDocumento);
  row.querySelector("[name='paginasDocumento']").value = asText(normalizado.paginasDocumento);
  row.querySelector("[name='numeroSei']").value = asText(normalizado.numeroSei);
  row.querySelector("[name='numeroProcessoDocumento']").value = asText(normalizado.numeroProcessoDocumento);
  row.querySelector("[name='eventosAssuntos']").value = asText(normalizado.eventosAssuntos);
}

function getDocumentosProcesso() {
  return Array.from(documentosTableBody.querySelectorAll(".document-row"))
    .map((row) => ({
      dataDocumento: prepararDataParaPayload(row.querySelector("[name='dataDocumento']")?.value),
      tipoDocumento: asText(row.querySelector("[name='tipoDocumento']")?.value),
      paginasDocumento: asText(row.querySelector("[name='paginasDocumento']")?.value),
      eventosAssuntos: asText(row.querySelector("[name='eventosAssuntos']")?.value),
      numeroSei: asText(row.querySelector("[name='numeroSei']")?.value),
      numeroProcessoDocumento: asText(row.querySelector("[name='numeroProcessoDocumento']")?.value)
    }))
    .filter((documento) => Object.values(documento).some(Boolean));
}

function normalizeDocumentos(value) {
  if (Array.isArray(value)) return value.map(normalizeDocumentoItem).filter((documento) => Object.values(documento).some(Boolean));
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? normalizeDocumentos(parsed) : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

function normalizeDocumentoItem(documento = {}) {
  if (typeof documento === "string") {
    try {
      return normalizeDocumentoItem(JSON.parse(documento));
    } catch (error) {
      return {
        dataDocumento: "",
        tipoDocumento: "",
        paginasDocumento: "",
        eventosAssuntos: asText(documento),
        numeroSei: "",
        numeroProcessoDocumento: ""
      };
    }
  }

  return {
    dataDocumento: prepararDataParaPayload(documento.dataDocumento || documento.DataDocumento || documento.data || documento.Data),
    tipoDocumento: asText(documento.tipoDocumento || documento.TipoDocumento || documento.tipo || documento.Tipo),
    paginasDocumento: asText(documento.paginasDocumento || documento.PaginasDocumento || documento.paginaDocumento || documento.PaginaDocumento || documento.paginas || documento.Paginas || documento.pagina || documento.Pagina),
    eventosAssuntos: asText(documento.eventosAssuntos || documento.EventosAssuntos || documento.assunto || documento.Assunto || documento.descricao || documento.Descricao),
    numeroSei: asText(documento.numeroSei || documento.NumeroSei || documento.NumeroSEI || documento.nSEI || documento.NSEI),
    numeroProcessoDocumento: asText(documento.numeroProcessoDocumento || documento.NumeroProcessoDocumento || documento.numeroProcesso || documento.NumeroProcesso || documento.processo || documento.Processo)
  };
}

function handleCoordenadaTableClick(event) {
  const removeButton = event.target.closest(".remove-coordenada-btn");
  if (removeButton) {
    removeCoordenadaRow(removeButton.closest(".coordinate-row"));
    return;
  }

  const addButton = event.target.closest(".add-coordenada-row-btn");
  if (addButton) addCoordenadaRow();
}

function handleCoordenadaTableInput(event) {
  const input = event.target.closest("[data-coordinate-value]");
  updateCoordinateFormatDetails(event.target.closest(".coordinate-row"));
  if (input) input.value = removeLettersFromCoordinate(input.value);
}

function addCoordenadaRow(coordenada = {}, shouldFocus = true) {
  const row = document.createElement("tr");
  row.className = "coordinate-row";
  row.innerHTML = `
    <td><input name="latitude" type="text" data-coordinate-value placeholder="Ex: 15° 47' 39&quot; S ou -15.7942" aria-label="Latitude"></td>
    <td>
      <select name="latitudeDirecao" aria-label="Direção da latitude" hidden>
        <option value="">Escolha</option>
        <option>Norte</option>
        <option>Sul</option>
      </select>
    </td>
    <td><input name="longitude" type="text" data-coordinate-value placeholder="Ex: 47° 52' 56&quot; O ou -47.8822" aria-label="Longitude"></td>
    <td>
      <select name="longitudeDirecao" aria-label="Direção da longitude" hidden>
        <option value="">Escolha</option>
        <option>Leste</option>
        <option>Oeste</option>
      </select>
    </td>
    <td>
      <select name="coordenadaSedeMunicipio" aria-label="Coordenada localizada na sede do município">
        <option value="">Escolha</option>
        <option>Sim</option>
        <option>Não</option>
      </select>
    </td>
    <td><input name="comentarioCoordenada" type="text" placeholder="Comentário da coordenada" aria-label="Comentário da coordenada"></td>
    <td class="coordinate-actions">
      <button type="button" class="icon-button remove-coordenada-btn" aria-label="Remover coordenada">×</button>
      <button type="button" class="icon-button add-coordenada-row-btn" aria-label="Adicionar coordenada">+</button>
    </td>
  `;
  coordenadasTableBody.append(row);
  setCoordenadaRowValues(row, coordenada);
  updateFormularioJsonSizeMeter();
  if (shouldFocus) row.querySelector("input, select")?.focus();
}

function removeCoordenadaRow(row) {
  if (!row) return;
  const rows = Array.from(coordenadasTableBody.querySelectorAll(".coordinate-row"));
  if (rows.length > 1) {
    row.remove();
    updateFormularioJsonSizeMeter();
    return;
  }

  setCoordenadaRowValues(row, {});
  updateFormularioJsonSizeMeter();
}

function resetCoordenadaRows() {
  const rows = Array.from(coordenadasTableBody.querySelectorAll(".coordinate-row"));
  if (!rows.length) return;
  rows.slice(1).forEach((row) => row.remove());
  setCoordenadaRowValues(rows[0], {});
}

function restoreCoordenadaRows(coordenadas = []) {
  const values = asList(coordenadas);
  resetCoordenadaRows();
  if (!values.length) return;

  const [first, ...rest] = values;
  setCoordenadaRowValues(coordenadasTableBody.querySelector(".coordinate-row"), first);
  rest.forEach((coordenada) => addCoordenadaRow(coordenada, false));
}

function restoreLegacyCoordenadaRow(values) {
  const coordenada = {
    tipoCoordenada: values.tipoCoordenada,
    outroFormatoCoordenada: values.outroFormatoCoordenada,
    latitude: values.latitude,
    latitudeDirecao: values.latitudeDirecao,
    longitude: values.longitude,
    longitudeDirecao: values.longitudeDirecao,
    coordenadaSedeMunicipio: values.coordenadaSedeMunicipio,
    comentarioCoordenada: values.comentarioCoordenada || values.comentario
  };

  if (Object.values(coordenada).some(Boolean)) {
    setCoordenadaRowValues(coordenadasTableBody.querySelector(".coordinate-row"), coordenada);
  }
}

function setCoordenadaRowValues(row, coordenada) {
  if (!row) return;
  if (row.querySelector("[name='tipoCoordenada']")) row.querySelector("[name='tipoCoordenada']").value = asText(coordenada.tipoCoordenada);
  if (row.querySelector("[name='outroFormatoCoordenada']")) row.querySelector("[name='outroFormatoCoordenada']").value = asText(coordenada.outroFormatoCoordenada);
  row.querySelector("[name='latitude']").value = asText(coordenada.latitude);
  if (row.querySelector("[name='latitudeDirecao']")) row.querySelector("[name='latitudeDirecao']").value = asText(coordenada.latitudeDirecao);
  row.querySelector("[name='longitude']").value = asText(coordenada.longitude);
  if (row.querySelector("[name='longitudeDirecao']")) row.querySelector("[name='longitudeDirecao']").value = asText(coordenada.longitudeDirecao);
  row.querySelector("[name='coordenadaSedeMunicipio']").value = asText(coordenada.coordenadaSedeMunicipio);
  row.querySelector("[name='comentarioCoordenada']").value = asText(coordenada.comentarioCoordenada || coordenada.comentario);
  updateCoordinateFormatDetails(row);
}

function getCoordenadasDetalhadas() {
  return Array.from(coordenadasTableBody.querySelectorAll(".coordinate-row"))
    .map((row) => ({
      tipoCoordenada: asText(row.querySelector("[name='tipoCoordenada']")?.value),
      outroFormatoCoordenada: asText(row.querySelector("[name='outroFormatoCoordenada']")?.value),
      latitude: asText(row.querySelector("[name='latitude']")?.value),
      latitudeDirecao: asText(row.querySelector("[name='latitudeDirecao']")?.value),
      longitude: asText(row.querySelector("[name='longitude']")?.value),
      longitudeDirecao: asText(row.querySelector("[name='longitudeDirecao']")?.value),
      coordenadaSedeMunicipio: asText(row.querySelector("[name='coordenadaSedeMunicipio']")?.value),
      comentarioCoordenada: asText(row.querySelector("[name='comentarioCoordenada']")?.value)
    }))
    .filter((coordenada) => Object.values(coordenada).some(Boolean));
}

function getCoordenadasGeograficas() {
  return getCoordenadasDetalhadas().map((coordenada) => ({
    latitude: asText(coordenada.latitude),
    latitudeDirecao: asText(coordenada.latitudeDirecao),
    longitude: asText(coordenada.longitude),
    longitudeDirecao: asText(coordenada.longitudeDirecao),
    comentario: asText(coordenada.comentarioCoordenada)
  }));
}

function handleMapaTableClick(event) {
  const removeButton = event.target.closest(".remove-mapa-btn");
  if (removeButton) {
    removeMapaRow(removeButton.closest(".map-row"));
    return;
  }

  const addButton = event.target.closest(".add-mapa-row-btn");
  if (addButton) addMapaRow();
}

function addMapaRow(mapa = {}, shouldFocus = true) {
  const row = document.createElement("tr");
  row.className = "map-row";
  row.innerHTML = `
    <td><input name="numeroSeiMapa" type="text" placeholder="Nº do documento SEI" aria-label="Nº do documento SEI"></td>
    <td><input name="paginaMapa" type="number" min="0" placeholder="Página" aria-label="Página do mapa ou material cartográfico"></td>
    <td class="document-actions">
      <button type="button" class="icon-button remove-mapa-btn" aria-label="Remover mapa ou material cartográfico">×</button>
      <button type="button" class="icon-button add-mapa-row-btn" aria-label="Adicionar mapa ou material cartográfico">+</button>
    </td>
  `;
  mapasTableBody.append(row);
  setMapaRowValues(row, mapa);
  updateFormularioJsonSizeMeter();
  if (shouldFocus) row.querySelector("input")?.focus();
}

function removeMapaRow(row) {
  if (!row) return;
  const rows = Array.from(mapasTableBody.querySelectorAll(".map-row"));
  if (rows.length > 1) {
    row.remove();
    updateFormularioJsonSizeMeter();
    return;
  }

  setMapaRowValues(row, {});
  updateFormularioJsonSizeMeter();
}

function resetMapaRows() {
  const rows = Array.from(mapasTableBody.querySelectorAll(".map-row"));
  if (!rows.length) return;
  rows.slice(1).forEach((row) => row.remove());
  setMapaRowValues(rows[0], {});
}

function restoreMapaRows(mapas = []) {
  const values = normalizeMapasCartograficos(mapas);
  resetMapaRows();
  if (!values.length) return;

  const [first, ...rest] = values;
  setMapaRowValues(mapasTableBody.querySelector(".map-row"), first);
  rest.forEach((mapa) => addMapaRow(mapa, false));
}

function setMapaRowValues(row, mapa) {
  if (!row) return;
  row.querySelector("[name='numeroSeiMapa']").value = asText(mapa.numeroSei || mapa.numeroSeiMapa || mapa.documentoSei);
  row.querySelector("[name='paginaMapa']").value = asText(mapa.pagina || mapa.paginaMapa);
}

function getMapasCartograficos() {
  return Array.from(mapasTableBody.querySelectorAll(".map-row"))
    .map((row) => ({
      numeroSei: asText(row.querySelector("[name='numeroSeiMapa']")?.value),
      pagina: asText(row.querySelector("[name='paginaMapa']")?.value)
    }))
    .filter((mapa) => mapa.numeroSei || mapa.pagina);
}

function normalizeMapasCartograficos(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

function updateCoordinateFormatDetails(row = null) {
  const rows = row ? [row] : Array.from(coordenadasTableBody.querySelectorAll(".coordinate-row"));
  rows.forEach((coordinateRow) => {
    if (!coordinateRow) return;
    const format = coordinateRow.querySelector("[name='tipoCoordenada']")?.value;
    const detail = coordinateRow.querySelector("[name='outroFormatoCoordenada']");
    if (!detail) return;

    const isOther = format === "Outro";
    detail.classList.toggle("is-visible", isOther);
    if (!isOther) detail.value = "";
  });
}

function updateVulnerabilityDetails() {
  const selected = new Set(getCheckedValues("vulnerabilidades"));
  const table = form.querySelector(".vulnerability-detail-table");
  const outroLabel = form.querySelector('[data-vulnerability-detail="Outros"] span');
  const outroTexto = asText(getValue("outroCriterioVulnerabilidade"));

  if (outroLabel) outroLabel.textContent = outroTexto || "Outros";
  table?.classList.toggle("has-visible-items", selected.size > 0);

  form.querySelectorAll("[data-vulnerability-detail]").forEach((row) => {
    row.classList.toggle("is-visible", selected.has(row.dataset.vulnerabilityDetail));
  });
}

function getDetalhesVulnerabilidades() {
  return Array.from(form.querySelectorAll("[data-vulnerability-detail]"))
    .map((row) => {
      const criterio = row.dataset.vulnerabilityDetail;
      const criterioDescricao = criterio === "Outros" ? asText(getValue("outroCriterioVulnerabilidade")) : "";
      const fonte = asText(row.querySelector("[data-vulnerability-source]")?.value);
      const dataReferencia = prepararDataParaPayload(row.querySelector("[data-vulnerability-date]")?.value);
      return { criterio, criterioDescricao, fonte, dataReferencia };
    })
    .filter((item) => item.criterioDescricao || item.fonte || item.dataReferencia);
}

function getPrimeiroDetalheVulnerabilidade() {
  return getDetalhesVulnerabilidades()[0] || {};
}

function restoreDetalhesVulnerabilidades(detalhes = []) {
  const values = normalizeDetalhesVulnerabilidades(detalhes);
  values.forEach((item) => {
    const row = form.querySelector(`[data-vulnerability-detail="${item.criterio}"]`);
    if (!row) return;
    const source = row.querySelector("[data-vulnerability-source]");
    const date = row.querySelector("[data-vulnerability-date]");
    if (source) source.value = asText(item.fonte);
    if (date) date.value = converterDataParaBR(item.dataReferencia);
  });
}

function normalizeDetalhesVulnerabilidades(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

function getOutroCriterioVulnerabilidade(detalhes = []) {
  const item = normalizeDetalhesVulnerabilidades(detalhes).find((detalhe) => detalhe.criterio === "Outros");
  return asText(item?.criterioDescricao || item?.descricao || item?.outroCriterio);
}

function normalizeDetalhesComunidadesTradicionais(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

function areCoordenadasValid() {
  const coordenadas = getCoordenadasDetalhadas();
  return coordenadas.some((coordenada) =>
    coordenada.latitude &&
    coordenada.longitude
  );
}

function normalizeCoordenadas(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

function removeLettersFromCoordinate(value) {
  return String(value || "");
}

function handleProcessosAnalisadosClick() {}

function adicionarProcessoAnalisado() {}

function removerProcessoAnalisado() {}

function carregarProcessosAnalisados() {}

function getProcessosAnalisados() {
  return [];
}

function handleAldeiaKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addAldeiaField();
}

function addAldeiaField(value = "") {
  const rawValue = typeof value === "string" && value.trim() ? value : aldeiaInput.value;
  const aldeia = asText(rawValue).trim();
  if (!aldeia || selectedAldeiasComunidades.includes(aldeia)) return;

  selectedAldeiasComunidades.push(aldeia);
  aldeiaInput.value = "";
  renderAldeiaChips();
}

function removeAldeiaField(event) {
  const button = event.target.closest("button[data-aldeia]");
  if (!button) return;

  selectedAldeiasComunidades = selectedAldeiasComunidades.filter((aldeia) => aldeia !== button.dataset.aldeia);
  renderAldeiaChips();
}

function resetAldeiaFields() {
  selectedAldeiasComunidades = [];
  if (aldeiaInput) aldeiaInput.value = "";
  renderAldeiaChips();
}

function restoreAldeiaFields(values) {
  selectedAldeiasComunidades = asListOrSplit(values).filter(Boolean);
  if (aldeiaInput) aldeiaInput.value = "";
  renderAldeiaChips();
}

function renderAldeiaChips() {
  renderChips(aldeiaChips, selectedAldeiasComunidades, "aldeia", "Remover aldeia ou comunidade");
}

function getAldeiasComunidades() {
  return selectedAldeiasComunidades.filter(Boolean);
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFieldVisible(field) {
  return Boolean(field.offsetParent);
}

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message is-visible ${type}`;
}

function clearMessage() {
  messageBox.textContent = "";
  messageBox.className = "message";
}

function showAccessMessage(text, type) {
  accessMessage.textContent = text;
  accessMessage.className = `message is-visible ${type}`;
}

function clearAccessMessage() {
  accessMessage.textContent = "";
  accessMessage.className = "message";
}

// Produto 2 overrides: keep shared helpers, replace the copied Produto 1 behavior.
function updateConditionals({ renderDynamic = true } = {}) {
  setConditional("outraEtniaWrap", selectedEtnias.includes("Outros"));
  setConditional("sobreposicoesWrap", getValue("sobreposicoes") === "Sim");
  setConditional("indigenasAreaWrap", getValue("indigenasArea") === "Sim");
  setConditional("comunidadesTradicionaisWrap", getValue("comunidadesTradicionais") === "Sim");
  setConditional("outrasComunidadesTradicionaisWrap", selectedComunidadesTradicionais.includes("Outros"));
  setConditional("povosIsoladosWrap", getValue("povosIsolados") === "Sim");
  setConditional("tiposOcupantesNaoIndigenasWrap", getValue("ocupantesNaoIndigenas") === "Sim");
  setConditional("outroOcupanteNaoIndigenaWrap", getValue("ocupantesNaoIndigenas") === "Sim" && getCheckedValues("tiposOcupantesNaoIndigenas").includes("Outros"));
  setConditional("idsReivindicacoesRelacionadasWrap", getValue("relacaoOutrasReivindicacoes") === "Sim");
  setConditional("descricaoRelacaoReivindicacoesWrap", getValue("relacaoOutrasReivindicacoes") === "Sim");

  const demandas = getCheckedValues("tipoDemanda");
  const isRevisao = hasDemand(demandas, "Revisão de limites");
  const isReserva = hasDemand(demandas, "Reserva Indígena");
  const hasUltimoAtoRegularizacao = Boolean(getValue("ultimoAtoRegularizacao"));
  const hasImovelDestinacao = getValue("imovelDestinacaoComunidade") === "Sim";
  setConditional("revisaoLimitesWrap", isRevisao);
  setConditional("reservaIndigenaWrap", isReserva);
  setConditional("nomeDocumentoRegularizacaoWrap", isRevisao && hasUltimoAtoRegularizacao);
  setConditional("dataDocumentoRegularizacaoWrap", isRevisao && hasUltimoAtoRegularizacao);
  setConditional("tiposErroPrimeiraDemarcacaoWrap", isRevisao && getValue("erroPrimeiraDemarcacao") === "Sim");
  setConditional("outroErroPrimeiraDemarcacaoWrap", isRevisao && getValue("erroPrimeiraDemarcacao") === "Sim" && getCheckedValues("tiposErroPrimeiraDemarcacao").includes("Outros"));
  setConditional("informacoesImovelDestinacaoWrap", isReserva && hasImovelDestinacao);

  if (!isRevisao || !hasUltimoAtoRegularizacao) {
    clearFieldValue("nomeDocumentoRegularizacao");
    clearFieldValue("dataDocumentoRegularizacao");
  }
  if (!isReserva || !hasImovelDestinacao) clearFieldValue("informacoesImovelDestinacao");

  if (renderDynamic) {
    renderAcoesJudiciaisDetalhadas();
    renderDetalhesConflitos();
  }
  updateVulnerabilityDetails();
  updateCoordinateFormatDetails();
}

function validateRequiredFields(isDraftSave = false) {
  clearValidationErrors();
  if (isDraftSave) return [];

  updateConditionals();
  const errors = [];
  const demandas = getCheckedValues("tipoDemanda");
  const isRevisao = hasDemand(demandas, "Revisão de limites");
  const isReserva = hasDemand(demandas, "Reserva Indígena");
  const requiredRules = [
    { fieldId: "consultorNome", label: "Nome completo do(a) consultor(a)", isValid: () => hasValue("consultorNome") },
    { fieldId: "areaEstudo", label: "Área de estudo", isValid: () => hasValue("areaEstudo") },
    { fieldId: "reivindicacaoId", label: "ID", isValid: () => hasValue("reivindicacaoId") },
    { fieldId: "nomeReivindicacao", label: "Nome da reivindicação", isValid: () => hasValue("nomeReivindicacao") },
    { fieldId: "etnias", label: "Etnias", isValid: () => selectedEtnias.length > 0 },
    { fieldId: "outraEtnia", label: "Outra etnia", isValid: () => !selectedEtnias.includes("Outros") || selectedOutrasEtnias.length > 0 },
    { fieldId: "tipoDemanda", label: "Tipo da demanda", isValid: () => demandas.length === 1 },
    { fieldId: "tiposErroPrimeiraDemarcacao", label: "Tipo de erro identificado", isValid: () => !isRevisao || getValue("erroPrimeiraDemarcacao") !== "Sim" || getCheckedValues("tiposErroPrimeiraDemarcacao").length > 0 },
    { fieldId: "outroErroPrimeiraDemarcacao", label: "Descrição de outros erros", isValid: () => !isRevisao || !getCheckedValues("tiposErroPrimeiraDemarcacao").includes("Outros") || hasValue("outroErroPrimeiraDemarcacao") },
    { fieldId: "estados", label: "Estado", isValid: () => selectedEstados.length > 0 },
    { fieldId: "municipios", label: "Município", isValid: () => selectedMunicipios.length > 0 },
    { fieldId: "localizacaoDemanda", label: "Localização da demanda", isValid: () => hasValue("localizacaoDemanda") },
    { fieldId: "coordenadas", label: "Coordenadas geográficas", isValid: () => areCoordenadasValid() },
    { fieldId: "bioma", label: "Bioma", isValid: () => getCheckedValues("bioma").length > 0 },
    { fieldId: "faixaFronteira", label: "Faixa de Fronteira", isValid: () => hasChecked("faixaFronteira") },
    { fieldId: "sobreposicoes", label: "Sobreposições", isValid: () => hasChecked("sobreposicoes") },
    { fieldId: "tiposSobreposicao", label: "Tipos de sobreposição", isValid: () => getValue("sobreposicoes") !== "Sim" || getCheckedValues("tiposSobreposicao").length > 0 },
    { fieldId: "detalheOutrasSobreposicoes", label: "Detalhe de outras sobreposições", isValid: () => !getCheckedValues("tiposSobreposicao").includes("Outros") || hasValue("detalheOutrasSobreposicoes") },
    { fieldId: "indigenasArea", label: "Indígenas estão na área reivindicada", isValid: () => hasChecked("indigenasArea") },
    { fieldId: "situacaoPosse", label: "Situação de posse", isValid: () => getValue("indigenasArea") !== "Sim" || hasChecked("situacaoPosse") },
    { fieldId: "vulnerabilidades", label: "Critério de vulnerabilidade", isValid: () => getCheckedValues("vulnerabilidades").length > 0 },
    { fieldId: "comunidadesTradicionais", label: "Comunidades tradicionais", isValid: () => hasChecked("comunidadesTradicionais") },
    { fieldId: "descricaoComunidadeTradicional", label: "Outra comunidade tradicional", isValid: () => !selectedComunidadesTradicionais.includes("Outros") || hasValue("descricaoComunidadeTradicional") },
    { fieldId: "povosIsolados", label: "Povos isolados", isValid: () => hasChecked("povosIsolados") },
    { fieldId: "detalhesPovosIsolados", label: "Detalhes de povos isolados", isValid: () => getValue("povosIsolados") !== "Sim" || hasValue("detalhesPovosIsolados") },
    { fieldId: "outroOcupanteNaoIndigena", label: "Descrição de outros ocupantes", isValid: () => !getCheckedValues("tiposOcupantesNaoIndigenas").includes("Outros") || hasValue("outroOcupanteNaoIndigena") },
    { fieldId: "idsReivindicacoesRelacionadas", label: "IDs das reivindicações relacionadas", isValid: () => getValue("relacaoOutrasReivindicacoes") !== "Sim" || hasValue("idsReivindicacoesRelacionadas") },
    { fieldId: "descricaoRelacaoReivindicacoes", label: "Descrição da relação", isValid: () => getValue("relacaoOutrasReivindicacoes") !== "Sim" || hasValue("descricaoRelacaoReivindicacoes") }
  ];

  requiredRules.forEach((rule) => {
    if (rule.isValid()) return;
    const error = showFieldError(rule.fieldId, rule.message || getRequiredFieldMessage(rule.fieldId));
    errors.push({ fieldId: rule.fieldId, label: rule.label, stepIndex: error.stepIndex, target: error.target });
  });

  getInvalidDateFields().forEach((field, index) => {
    const error = showControlError(field, `dateField-${index}`, "Informe uma data válida no formato dd/mm/aaaa.");
    errors.push({ fieldId: `dateField-${index}`, label: getDateFieldLabel(field), stepIndex: error.stepIndex, target: error.target });
  });

  return errors;
}

function isRequiredFieldResolved(fieldId) {
  return validateRequiredFields(true).length === 0 || Boolean(fieldId);
}

function montarFormularioJson(statusFormulario = "Rascunho", now = new Date().toISOString()) {
  const tipoDemanda = asText(getValue("tipoDemanda"));
  const isRevisao = hasDemand([tipoDemanda], "Revisão de limites");
  const isReserva = hasDemand([tipoDemanda], "Reserva Indígena");
  const ultimoAtoRegularizacao = asText(getValue("ultimoAtoRegularizacao"));
  const hasUltimoAtoRegularizacao = Boolean(ultimoAtoRegularizacao);
  const imovelDestinacaoComunidade = asText(getValue("imovelDestinacaoComunidade"));
  const hasImovelDestinacao = imovelDestinacaoComunidade === "Sim";
  const estados = asList(getSelectedEstados());
  const municipios = asList(getSelectedMunicipios());
  const coordenadasDetalhadas = asList(getCoordenadasDetalhadas());
  const coordenadas = asList(getCoordenadasGeograficas());
  const primeiraCoordenada = coordenadasDetalhadas[0] || {};
  const tiposSobreposicao = getValue("sobreposicoes") === "Sim" ? asList(getCheckedValues("tiposSobreposicao")) : [];
  const tiposErro = isRevisao && getValue("erroPrimeiraDemarcacao") === "Sim" ? asList(getCheckedValues("tiposErroPrimeiraDemarcacao")) : [];
  const tiposOcupantes = getValue("ocupantesNaoIndigenas") === "Sim" ? asList(getCheckedValues("tiposOcupantesNaoIndigenas")) : [];
  const temRelacao = getValue("relacaoOutrasReivindicacoes") === "Sim";

  return {
    formularioId: asText(getCurrentFormularioId()),
    tokenSecreto: asText(SECRET_TOKEN),
    statusFormulario: asText(statusFormulario),
    atualizadoEm: asText(now),
    enviadoEm: statusFormulario === "Enviado" ? asText(now) : "",
    origem: "github-pages-funai",
    produto: "Produto 2",
    etapaAtual: currentStep,
    consultor: {
      nome: asText(getValue("consultorNome")),
      email: asText(getAuthorizedEmail()),
      areaEstudo: asText(getValue("areaEstudo"))
    },
    reivindicacao: {
      id: asText(getValue("reivindicacaoId")),
      nome: asText(getValue("nomeReivindicacao")),
      etnias: asList(getSelectedEtnias()),
      outraEtnia: asText(getSelectedOutrasEtnias().join(", ")),
      outrasEtnias: asList(getSelectedOutrasEtnias()),
      tipoDemanda,
      revisaoLimites: isRevisao ? {
        nomeTiOriginal: asText(getValue("nomeTiOriginal")),
        ultimoAtoRegularizacao,
        nomeDocumentoRegularizacao: hasUltimoAtoRegularizacao ? asText(getValue("nomeDocumentoRegularizacao")) : "",
        dataDocumentoRegularizacao: hasUltimoAtoRegularizacao ? prepararDataParaPayload(getValue("dataDocumentoRegularizacao")) : "",
        dataPrimeiraMencaoReivindicacao: prepararDataParaPayload(getValue("dataPrimeiraMencaoReivindicacao")),
        areaPrazoDecadencial: asText(getValue("areaPrazoDecadencial")),
        erroPrimeiraDemarcacao: asText(getValue("erroPrimeiraDemarcacao")),
        tiposErroPrimeiraDemarcacao: tiposErro,
        outroErroPrimeiraDemarcacao: tiposErro.includes("Outros") ? asText(getValue("outroErroPrimeiraDemarcacao")) : "",
        enquadraRequisitosStf: asText(getValue("enquadraRequisitosStf"))
      } : {},
      reservaIndigena: isReserva ? {
        comunidadeIndicouArea: asText(getValue("comunidadeIndicouArea")),
        imovelDestinacaoComunidade,
        informacoesImovelDestinacao: hasImovelDestinacao ? asText(getValue("informacoesImovelDestinacao")) : ""
      } : {}
    },
    caracterizacaoArea: {
      estado: asText(estados.join(", ")),
      estados,
      municipio: asText(municipios.join(", ")),
      municipios,
      localizacaoDemanda: asText(getValue("localizacaoDemanda")),
      coordenadas,
      coordenadasDetalhadas,
      latitude: asText(primeiraCoordenada.latitude),
      tipoCoordenada: asText(primeiraCoordenada.tipoCoordenada),
      outroFormatoCoordenada: asText(primeiraCoordenada.outroFormatoCoordenada),
      latitudeDirecao: asText(primeiraCoordenada.latitudeDirecao),
      longitude: asText(primeiraCoordenada.longitude),
      longitudeDirecao: asText(primeiraCoordenada.longitudeDirecao),
      coordenadaSedeMunicipio: asText(primeiraCoordenada.coordenadaSedeMunicipio),
      comentarioCoordenada: asText(primeiraCoordenada.comentarioCoordenada),
      bioma: asList(getCheckedValues("bioma")),
      faixaFronteira: asText(getValue("faixaFronteira")),
      sobreposicoes: asText(getValue("sobreposicoes")),
      tiposSobreposicao,
      detalheUcFederal: tiposSobreposicao.includes("Unidade de Conservação Federal") ? asText(getValue("detalheUcFederal")) : "",
      detalheUcEstadual: tiposSobreposicao.includes("Unidade de Conservação Estadual") ? asText(getValue("detalheUcEstadual")) : "",
      detalheUcMunicipal: tiposSobreposicao.includes("Unidade de Conservação Municipal") ? asText(getValue("detalheUcMunicipal")) : "",
      detalheGlebaFederal: tiposSobreposicao.includes("Gleba Pública Federal") ? asText(getValue("detalheGlebaFederal")) : "",
      detalheGlebaEstadual: tiposSobreposicao.includes("Gleba Pública Estadual") ? asText(getValue("detalheGlebaEstadual")) : "",
      detalheTerritorioQuilombola: tiposSobreposicao.includes("Território Quilombola") ? asText(getValue("detalheTerritorioQuilombola")) : "",
      detalheProjetoAssentamento: tiposSobreposicao.includes("Projeto de Assentamento (PA)") ? asText(getValue("detalheProjetoAssentamento")) : "",
      detalheProjetoAssentamentoAgroextrativista: tiposSobreposicao.includes("Projeto de Assentamento Agroextrativista (PAE)") ? asText(getValue("detalheProjetoAssentamentoAgroextrativista")) : "",
      detalheProjetoDesenvolvimentoSustentavel: tiposSobreposicao.includes("Projeto de Desenvolvimento Sustentável (PDS)") ? asText(getValue("detalheProjetoDesenvolvimentoSustentavel")) : "",
      detalheProjetoAssentamentoFlorestal: tiposSobreposicao.includes("Projeto de Assentamento Florestal (PAF)") ? asText(getValue("detalheProjetoAssentamentoFlorestal")) : "",
      detalheOutrasSobreposicoes: tiposSobreposicao.includes("Outros") ? asText(getValue("detalheOutrasSobreposicoes")) : ""
    },
    situacaoArea: {
      indigenasArea: asText(getValue("indigenasArea")),
      situacaoPosse: getValue("indigenasArea") === "Sim" ? asText(getValue("situacaoPosse")) : "",
      vulnerabilidades: asList(getCheckedValues("vulnerabilidades")),
      comunidadesTradicionais: asText(getValue("comunidadesTradicionais")),
      tiposComunidadeTradicional: getValue("comunidadesTradicionais") === "Sim" ? asList(getSelectedComunidadesTradicionais()) : [],
      descricaoComunidadeTradicional: selectedComunidadesTradicionais.includes("Outros") ? asText(getValue("descricaoComunidadeTradicional")) : "",
      povosIsolados: asText(getValue("povosIsolados")),
      detalhesPovosIsolados: getValue("povosIsolados") === "Sim" ? asText(getValue("detalhesPovosIsolados")) : "",
      ocupantesNaoIndigenas: asText(getValue("ocupantesNaoIndigenas")),
      tiposOcupantesNaoIndigenas: tiposOcupantes,
      outroOcupanteNaoIndigena: tiposOcupantes.includes("Outros") ? asText(getValue("outroOcupanteNaoIndigena")) : "",
      nivelTensaoLocal: asText(getValue("nivelTensaoLocal"))
    },
    encaminhamentos: {
      reivindicacaoAtivaAtual: asText(getValue("reivindicacaoAtivaAtual")),
      relacaoOutrasReivindicacoes: asText(getValue("relacaoOutrasReivindicacoes")),
      idsReivindicacoesRelacionadas: temRelacao ? parseIdsRelacionados(getValue("idsReivindicacoesRelacionadas")) : [],
      descricaoRelacaoReivindicacoes: temRelacao ? asText(getValue("descricaoRelacaoReivindicacoes")) : ""
    }
  };
}

function garantirTiposPayload(payload) {
  const normalizado = {
    ...payload,
    formularioJson: normalizarTextoParaPowerAutomate(payload.formularioJson),
    consultor: garantirObjeto(payload.consultor),
    reivindicacao: garantirObjeto(payload.reivindicacao),
    caracterizacaoArea: garantirObjeto(payload.caracterizacaoArea),
    situacaoArea: garantirObjeto(payload.situacaoArea),
    encaminhamentos: garantirObjeto(payload.encaminhamentos)
  };

  normalizado.reivindicacao.etnias = garantirArray(normalizado.reivindicacao.etnias);
  normalizado.reivindicacao.outrasEtnias = garantirArray(normalizado.reivindicacao.outrasEtnias);
  normalizado.reivindicacao.revisaoLimites = garantirObjeto(normalizado.reivindicacao.revisaoLimites);
  normalizado.reivindicacao.revisaoLimites.tiposErroPrimeiraDemarcacao = garantirArray(normalizado.reivindicacao.revisaoLimites.tiposErroPrimeiraDemarcacao);
  normalizado.reivindicacao.reservaIndigena = garantirObjeto(normalizado.reivindicacao.reservaIndigena);
  normalizado.caracterizacaoArea.estados = garantirArray(normalizado.caracterizacaoArea.estados);
  normalizado.caracterizacaoArea.municipios = garantirArray(normalizado.caracterizacaoArea.municipios);
  normalizado.caracterizacaoArea.coordenadas = garantirArray(normalizado.caracterizacaoArea.coordenadas);
  normalizado.caracterizacaoArea.coordenadasDetalhadas = garantirArray(normalizado.caracterizacaoArea.coordenadasDetalhadas);
  normalizado.caracterizacaoArea.bioma = garantirArray(normalizado.caracterizacaoArea.bioma);
  normalizado.caracterizacaoArea.tiposSobreposicao = garantirArray(normalizado.caracterizacaoArea.tiposSobreposicao);
  normalizado.situacaoArea.vulnerabilidades = garantirArray(normalizado.situacaoArea.vulnerabilidades);
  normalizado.situacaoArea.tiposComunidadeTradicional = garantirArray(normalizado.situacaoArea.tiposComunidadeTradicional);
  normalizado.situacaoArea.tiposOcupantesNaoIndigenas = garantirArray(normalizado.situacaoArea.tiposOcupantesNaoIndigenas);
  normalizado.encaminhamentos.idsReivindicacoesRelacionadas = garantirArray(normalizado.encaminhamentos.idsReivindicacoesRelacionadas);

  normalizado.ocupacaoIndigena = normalizado.situacaoArea;
  normalizado.resumoProcesso = {};
  normalizado.statusProcesso = {};

  return normalizado;
}

function normalizarPayloadParaPowerAutomate(payload) {
  const normalizado = garantirTiposPayload(payload);
  normalizado.formularioJson = JSON.stringify({
    ...converterJsonSerializadoEmObjeto(normalizado.formularioJson),
    consultor: normalizado.consultor,
    reivindicacao: normalizado.reivindicacao,
    caracterizacaoArea: normalizado.caracterizacaoArea,
    situacaoArea: normalizado.situacaoArea,
    encaminhamentos: normalizado.encaminhamentos,
    resumoProcesso: undefined,
    statusProcesso: undefined,
    ocupacaoIndigena: undefined
  }, (_key, value) => value === undefined ? undefined : value);
  return normalizado;
}

function prepararPayloadPowerAutomate(payload) {
  const payloadNormalizado = converterJsonSerializadoEmObjeto({
    ...payload,
    formularioJson: converterJsonSerializadoEmObjeto(payload.formularioJson),
    dados: converterJsonSerializadoEmObjeto(payload.dados),
    payload: converterJsonSerializadoEmObjeto(payload.payload),
    consultor: converterJsonSerializadoEmObjeto(payload.consultor),
    reivindicacao: converterJsonSerializadoEmObjeto(payload.reivindicacao),
    caracterizacaoArea: converterJsonSerializadoEmObjeto(payload.caracterizacaoArea),
    situacaoArea: converterJsonSerializadoEmObjeto(payload.situacaoArea),
    encaminhamentos: converterJsonSerializadoEmObjeto(payload.encaminhamentos)
  });

  return {
    ...payloadNormalizado,
    formularioJson: serializarFormularioJsonParaPowerAutomate(payloadNormalizado.formularioJson)
  };
}

function flattenDraft(draft) {
  const reivindicacao = draft.reivindicacao || {};
  const revisao = reivindicacao.revisaoLimites || {};
  const reserva = reivindicacao.reservaIndigena || {};
  const caracterizacao = draft.caracterizacaoArea || {};
  const situacao = draft.situacaoArea || draft.ocupacaoIndigena || {};
  const encaminhamentos = draft.encaminhamentos || {};
  return {
    consultorEmail: pickField(draft, directValue(() => draft.consultor?.email), "ConsultorEmail", "consultorEmail"),
    consultorNome: pickField(draft, directValue(() => draft.consultor?.nome), "ConsultorNome", "Title", "consultorNome"),
    areaEstudo: pickField(draft, directValue(() => draft.consultor?.areaEstudo), "AreaEstudo", "field_1", "areaEstudo"),
    reivindicacaoId: pickField(draft, directValue(() => reivindicacao.id), "ReivindicacaoId", "field_2", "reivindicacaoId"),
    nomeReivindicacao: pickField(draft, directValue(() => reivindicacao.nome), "NomeReivindicacao", "field_3", "nomeReivindicacao"),
    etnias: asListOrSplit(reivindicacao.etnias || draft.Etnias || draft.etnias),
    outraEtnia: reivindicacao.outraEtnia,
    outrasEtnias: asListOrSplit(reivindicacao.outrasEtnias || reivindicacao.outraEtnia),
    tipoDemanda: asListOrSplit(reivindicacao.tipoDemanda)[0] || asText(reivindicacao.tipoDemanda),
    nomeTiOriginal: revisao.nomeTiOriginal,
    ultimoAtoRegularizacao: revisao.ultimoAtoRegularizacao,
    nomeDocumentoRegularizacao: revisao.nomeDocumentoRegularizacao,
    dataDocumentoRegularizacao: revisao.dataDocumentoRegularizacao,
    dataPrimeiraMencaoReivindicacao: revisao.dataPrimeiraMencaoReivindicacao,
    areaPrazoDecadencial: revisao.areaPrazoDecadencial,
    erroPrimeiraDemarcacao: revisao.erroPrimeiraDemarcacao,
    tiposErroPrimeiraDemarcacao: revisao.tiposErroPrimeiraDemarcacao,
    outroErroPrimeiraDemarcacao: revisao.outroErroPrimeiraDemarcacao,
    enquadraRequisitosStf: revisao.enquadraRequisitosStf,
    comunidadeIndicouArea: reserva.comunidadeIndicouArea,
    imovelDestinacaoComunidade: reserva.imovelDestinacaoComunidade,
    informacoesImovelDestinacao: reserva.informacoesImovelDestinacao,
    estados: asListOrSplit(caracterizacao.estados || caracterizacao.estado || draft.Estados || draft.estados),
    municipios: asListOrSplit(caracterizacao.municipios || caracterizacao.municipio || draft.Municipios || draft.municipios),
    localizacaoDemanda: caracterizacao.localizacaoDemanda,
    coordenadas: normalizeCoordenadas(caracterizacao.coordenadasDetalhadas || caracterizacao.coordenadas || draft.Coordenadas || draft.coordenadas),
    tipoCoordenada: caracterizacao.tipoCoordenada,
    outroFormatoCoordenada: caracterizacao.outroFormatoCoordenada,
    latitude: caracterizacao.latitude,
    latitudeDirecao: caracterizacao.latitudeDirecao,
    longitude: caracterizacao.longitude,
    longitudeDirecao: caracterizacao.longitudeDirecao,
    coordenadaSedeMunicipio: caracterizacao.coordenadaSedeMunicipio,
    comentarioCoordenada: caracterizacao.comentarioCoordenada,
    bioma: caracterizacao.bioma,
    faixaFronteira: caracterizacao.faixaFronteira,
    sobreposicoes: caracterizacao.sobreposicoes,
    tiposSobreposicao: caracterizacao.tiposSobreposicao,
    detalheUcFederal: caracterizacao.detalheUcFederal,
    detalheUcEstadual: caracterizacao.detalheUcEstadual,
    detalheUcMunicipal: caracterizacao.detalheUcMunicipal,
    detalheGlebaFederal: caracterizacao.detalheGlebaFederal,
    detalheGlebaEstadual: caracterizacao.detalheGlebaEstadual,
    detalheTerritorioQuilombola: caracterizacao.detalheTerritorioQuilombola,
    detalheProjetoAssentamento: caracterizacao.detalheProjetoAssentamento,
    detalheProjetoAssentamentoAgroextrativista: caracterizacao.detalheProjetoAssentamentoAgroextrativista,
    detalheProjetoDesenvolvimentoSustentavel: caracterizacao.detalheProjetoDesenvolvimentoSustentavel,
    detalheProjetoAssentamentoFlorestal: caracterizacao.detalheProjetoAssentamentoFlorestal,
    detalheOutrasSobreposicoes: caracterizacao.detalheOutrasSobreposicoes,
    indigenasArea: situacao.indigenasArea,
    situacaoPosse: situacao.situacaoPosse,
    vulnerabilidades: situacao.vulnerabilidades,
    comunidadesTradicionais: situacao.comunidadesTradicionais,
    tiposComunidadeTradicional: asListOrSplit(situacao.tiposComunidadeTradicional),
    descricaoComunidadeTradicional: situacao.descricaoComunidadeTradicional,
    povosIsolados: situacao.povosIsolados,
    detalhesPovosIsolados: situacao.detalhesPovosIsolados,
    ocupantesNaoIndigenas: situacao.ocupantesNaoIndigenas,
    tiposOcupantesNaoIndigenas: situacao.tiposOcupantesNaoIndigenas,
    outroOcupanteNaoIndigena: situacao.outroOcupanteNaoIndigena,
    nivelTensaoLocal: situacao.nivelTensaoLocal,
    reivindicacaoAtivaAtual: encaminhamentos.reivindicacaoAtivaAtual,
    relacaoOutrasReivindicacoes: encaminhamentos.relacaoOutrasReivindicacoes,
    idsReivindicacoesRelacionadas: asListOrSplit(encaminhamentos.idsReivindicacoesRelacionadas).join(", "),
    descricaoRelacaoReivindicacoes: encaminhamentos.descricaoRelacaoReivindicacoes
  };
}

function prepararImpressaoPdf(dadosOrigem = null) {
  document.querySelector(".pdf-print-root")?.remove();
  const dados = normalizarDadosParaPdf(dadosOrigem);
  const root = el("section", "pdf-print-root");
  const title = el("header", "pdf-cover pdf-section");
  title.append(
    el("h1", "", "Formulário 2 - Produto 2"),
    el("p", "pdf-footer-line", "CGID/DIDEM/FUNAI | 2026")
  );
  root.append(title);
  root.append(criarResumoPdf(dados));
  root.append(
    criarPdfSecao("1. Dados do consultor", [
      pdfField("Nome", dados.consultor?.nome),
      pdfField("E-mail", dados.consultor?.email),
      pdfField("Área de estudo", dados.consultor?.areaEstudo)
    ]),
    criarPdfSecao("2. Reivindicação", [
      pdfField("ID", dados.reivindicacao?.id),
      pdfField("Nome da reivindicação", dados.reivindicacao?.nome),
      pdfField("Etnias", asList(dados.reivindicacao?.etnias).join(", ")),
      pdfField("Outras etnias", asList(dados.reivindicacao?.outrasEtnias).join(", ")),
      pdfField("Tipo da demanda", dados.reivindicacao?.tipoDemanda)
    ]),
    criarPdfSecao("2.1 Revisão de limites", [
      pdfField("Nome da TI Original", dados.reivindicacao?.revisaoLimites?.nomeTiOriginal),
      pdfField("Último ato de regularização", dados.reivindicacao?.revisaoLimites?.ultimoAtoRegularizacao),
      pdfField("Nome do documento", dados.reivindicacao?.revisaoLimites?.nomeDocumentoRegularizacao),
      pdfField("Data do documento", formatarDataPdf(dados.reivindicacao?.revisaoLimites?.dataDocumentoRegularizacao)),
      pdfField("Data da primeira menção", formatarDataPdf(dados.reivindicacao?.revisaoLimites?.dataPrimeiraMencaoReivindicacao)),
      pdfRadio("Dentro do prazo decadencial de 5 anos?", dados.reivindicacao?.revisaoLimites?.areaPrazoDecadencial, ["Sim", "Não"]),
      pdfRadio("Erro grave e insanável na primeira demarcação?", dados.reivindicacao?.revisaoLimites?.erroPrimeiraDemarcacao, ["Sim", "Não"]),
      pdfField("Tipos de erro", asList(dados.reivindicacao?.revisaoLimites?.tiposErroPrimeiraDemarcacao).join(", ")),
      pdfField("Outro erro", dados.reivindicacao?.revisaoLimites?.outroErroPrimeiraDemarcacao),
      pdfRadio("Enquadra requisitos do STF?", dados.reivindicacao?.revisaoLimites?.enquadraRequisitosStf, ["Sim", "Não"])
    ]),
    criarPdfSecao("2.2 Reserva Indígena", [
      pdfRadio("Comunidade indicou área específica?", dados.reivindicacao?.reservaIndigena?.comunidadeIndicouArea, ["Sim", "Não"]),
      pdfRadio("Existe imóvel passível de destinação?", dados.reivindicacao?.reservaIndigena?.imovelDestinacaoComunidade, ["Sim", "Não"]),
      pdfField("Informações sobre imóvel/destinação", dados.reivindicacao?.reservaIndigena?.informacoesImovelDestinacao)
    ]),
    criarPdfSecao("3. Caracterização da área reivindicada", [
      pdfField("Estado", asList(dados.caracterizacaoArea?.estados).join(", ") || dados.caracterizacaoArea?.estado),
      pdfField("Município", asList(dados.caracterizacaoArea?.municipios).join(", ") || dados.caracterizacaoArea?.municipio),
      pdfField("Localização da demanda", dados.caracterizacaoArea?.localizacaoDemanda),
      pdfTabela("Coordenadas", ["Latitude", "Longitude", "Sede do município?", "Comentário"], asList(dados.caracterizacaoArea?.coordenadasDetalhadas).map((item) => [
        item.latitude,
        item.longitude,
        item.coordenadaSedeMunicipio,
        item.comentarioCoordenada
      ])),
      pdfField("Bioma", asList(dados.caracterizacaoArea?.bioma).join(", ")),
      pdfRadio("Faixa de Fronteira", dados.caracterizacaoArea?.faixaFronteira, ["Sim", "Não"]),
      pdfRadio("Sobreposições", dados.caracterizacaoArea?.sobreposicoes, ["Sim", "Não"]),
      pdfField("Tipos de sobreposição", asList(dados.caracterizacaoArea?.tiposSobreposicao).join(", "))
    ]),
    criarPdfSecao("4. Situação da área reivindicada", [
      pdfRadio("Indígenas estão na área reivindicada?", dados.situacaoArea?.indigenasArea, ["Sim", "Não"]),
      pdfField("Situação de posse", dados.situacaoArea?.situacaoPosse),
      pdfField("Critérios de vulnerabilidade", asList(dados.situacaoArea?.vulnerabilidades).join(", ")),
      pdfRadio("Outras comunidades tradicionais?", dados.situacaoArea?.comunidadesTradicionais, ["Sim", "Não"]),
      pdfField("Tipos de comunidade tradicional", asList(dados.situacaoArea?.tiposComunidadeTradicional).join(", ")),
      pdfRadio("Povos isolados?", dados.situacaoArea?.povosIsolados, ["Sim", "Não"]),
      pdfField("Detalhes de povos isolados", dados.situacaoArea?.detalhesPovosIsolados),
      pdfRadio("Presença de Ocupantes Não Indígenas", dados.situacaoArea?.ocupantesNaoIndigenas, ["Sim", "Não"]),
      pdfField("Tipos de ocupantes", asList(dados.situacaoArea?.tiposOcupantesNaoIndigenas).join(", ")),
      pdfField("Outro ocupante", dados.situacaoArea?.outroOcupanteNaoIndigena),
      pdfField("Nível de Tensão Local", dados.situacaoArea?.nivelTensaoLocal)
    ]),
    criarPdfSecao("5. Encaminhamentos e recomendações", [
      pdfRadio("Reivindicação permanece ativa e atual?", dados.encaminhamentos?.reivindicacaoAtivaAtual, ["Sim", "Não"]),
      pdfRadio("Relação com outras reivindicações?", dados.encaminhamentos?.relacaoOutrasReivindicacoes, ["Sim", "Não"]),
      pdfField("IDs relacionados", asList(dados.encaminhamentos?.idsReivindicacoesRelacionadas).join(", ")),
      pdfField("Descrição da relação", dados.encaminhamentos?.descricaoRelacaoReivindicacoes)
    ]),
    criarAssinaturaGovPdf()
  );

  document.body.append(root);
  window.addEventListener("afterprint", () => root.remove(), { once: true });
}

function normalizarDadosParaPdf(dadosOrigem) {
  if (!dadosOrigem) {
    const payload = normalizarPayloadParaPowerAutomate(buildPayload("Enviado"));
    return typeof payload.formularioJson === "string" ? JSON.parse(payload.formularioJson) : payload.formularioJson;
  }

  const dadosConvertidos = converterJsonSerializadoEmObjeto(dadosOrigem);
  const formularioJson = extrairFormularioJson(dadosConvertidos);
  const dados = formularioJson || dadosConvertidos || {};
  if (!dados.situacaoArea && dados.ocupacaoIndigena) dados.situacaoArea = dados.ocupacaoIndigena;
  return dados;
}

function criarResumoPdf(dados) {
  return criarPdfSecao("Resumo do rascunho", [
    pdfField("ID", dados.reivindicacao?.id),
    pdfField("Nome da reivindicação", dados.reivindicacao?.nome),
    pdfField("Tipo da demanda", dados.reivindicacao?.tipoDemanda),
    pdfField("Consultor", dados.consultor?.nome),
    pdfField("Área de estudo", dados.consultor?.areaEstudo),
    pdfField("Estado", asList(dados.caracterizacaoArea?.estados).join(", ") || dados.caracterizacaoArea?.estado),
    pdfField("Município", asList(dados.caracterizacaoArea?.municipios).join(", ") || dados.caracterizacaoArea?.municipio)
  ]);
}

function renderChips(container, values, dataName, ariaPrefix) {
  if (!container) return;
  container.innerHTML = "";
  values.map(asText).filter(Boolean).forEach((value) => {
    const chip = document.createElement("span");
    const removeButton = document.createElement("button");
    chip.className = "chip";
    chip.append(document.createTextNode(value));
    removeButton.type = "button";
    removeButton.dataset[dataName] = value;
    removeButton.setAttribute("aria-label", `${ariaPrefix} ${value}`);
    removeButton.textContent = "×";
    chip.append(removeButton);
    container.append(chip);
  });
  updateFormularioJsonSizeMeter();
}

function addCoordenadaRow(coordenada = {}, shouldFocus = true) {
  const row = document.createElement("tr");
  row.className = "coordinate-row";
  row.innerHTML = `
    <td><input name="latitude" type="text" data-coordinate-value placeholder="Ex: 15° 47' 39&quot; S ou -15.7942" aria-label="Latitude"></td>
    <td><input name="longitude" type="text" data-coordinate-value placeholder="Ex: 47° 52' 56&quot; O ou -47.8822" aria-label="Longitude"></td>
    <td>
      <select name="coordenadaSedeMunicipio" aria-label="Coordenada localizada na sede do município">
        <option value="">Escolha</option>
        <option>Sim</option>
        <option>Não</option>
      </select>
    </td>
    <td><input name="comentarioCoordenada" type="text" placeholder="Comentário da coordenada" aria-label="Comentário da coordenada"></td>
    <td class="coordinate-actions">
      <button type="button" class="icon-button remove-coordenada-btn" aria-label="Remover coordenada">×</button>
      <button type="button" class="icon-button add-coordenada-row-btn" aria-label="Adicionar coordenada">+</button>
    </td>
  `;
  coordenadasTableBody.append(row);
  setCoordenadaRowValues(row, coordenada);
  updateFormularioJsonSizeMeter();
  if (shouldFocus) row.querySelector("input, select")?.focus();
}

function resetDocumentoRows() {}
function resetMapaRows() {}
function restoreDocumentoRows() {}
function restoreLegacyDocumentoRow() {}
function restoreMapaRows() {}

function getDocumentosProcesso() {
  if (!documentosTableBody) return [];
  return [];
}

function getMapasCartograficos() {
  return [];
}

function getDetalhesVulnerabilidades() {
  return [];
}

function renderComunidadeTradicionalDetalhes() {}

function getDetalhesComunidadesTradicionais() {
  return [];
}

function areCoordenadasValid() {
  return getCoordenadasDetalhadas().some((coordenada) =>
    coordenada.latitude &&
    coordenada.longitude
  );
}

function shouldDisplayDateAsBrazil(name) {
  return [
    "dataDocumentoRegularizacao",
    "dataPrimeiraMencaoReivindicacao"
  ].includes(name);
}

function parseIdsRelacionados(value) {
  return asText(value)
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
