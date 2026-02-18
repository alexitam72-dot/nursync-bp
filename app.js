let currentScale = null;

const screens = {
  home: document.getElementById("screen-home"),
  form: document.getElementById("screen-form"),
  result: document.getElementById("screen-result"),
};

const formTitle = document.getElementById("formTitle");
const formFields = document.getElementById("formFields");

const badge = document.getElementById("resultBadge");
const scoreValue = document.getElementById("scoreValue");
const riskLabel = document.getElementById("riskLabel");
const riskStrip = document.getElementById("riskStrip");
const recText = document.getElementById("recText");

/** Config de escalas (prototipo) */
const SCALES = {
  norton: {
    name: "Escala de Norton",
    fields: [
      { key: "fisico", label: "Estado Físico", options: [
        { t:"Bueno", v:4 }, { t:"Regular", v:3 }, { t:"Malo", v:2 }, { t:"Muy malo", v:1 },
      ]},
      { key: "mental", label: "Estado Mental", options: [
        { t:"Alerta", v:4 }, { t:"Apático", v:3 }, { t:"Confuso", v:2 }, { t:"Estuporoso/Comatoso", v:1 },
      ]},
      { key: "actividad", label: "Actividad", options: [
        { t:"Ambulante", v:4 }, { t:"Camina con ayuda", v:3 }, { t:"Sentado", v:2 }, { t:"Encamado", v:1 },
      ]},
      { key: "movilidad", label: "Movilidad", options: [
        { t:"Completa", v:4 }, { t:"Disminuida", v:3 }, { t:"Muy limitada", v:2 }, { t:"Inmóvil", v:1 },
      ]},
      { key: "incontinencia", label: "Incontinencia", options: [
        { t:"Ninguna", v:4 }, { t:"Ocasional", v:3 }, { t:"Urinaria o fecal", v:2 }, { t:"Urinaria y fecal", v:1 },
      ]},
    ],
    // Norton: a menor puntaje, mayor riesgo (clásico)
    evaluate: (score) => {
      if (score >= 16) return { level:"Bajo", color:"green", strip:"Riesgo bajo de UPP.", rec:"Mantener cuidados estándar y reevaluar según protocolo." };
      if (score >= 12) return { level:"Medio", color:"yellow", strip:"Riesgo medio de UPP.", rec:"Implementar plan preventivo: cambios posturales, hidratación de piel y superficies de alivio." };
      return { level:"Alto", color:"red", strip:"Alto riesgo de UPP detectado.", rec:"Iniciar protocolo intensivo: cambios posturales estrictos, protección de prominencias óseas y seguimiento frecuente." };
    }
  },

  morse: {
    name: "Escala de Morse",
    fields: [
      { key:"caida_previa", label:"Caída previa", options:[ {t:"No", v:0}, {t:"Sí", v:25} ] },
      { key:"dx_secundario", label:"Diagnóstico secundario", options:[ {t:"No", v:0}, {t:"Sí", v:15} ] },
      { key:"ayuda_deambular", label:"Ayuda para deambular", options:[
        {t:"Ninguna / reposo / asistido", v:0},
        {t:"Bastón / muleta / caminador", v:15},
        {t:"Se apoya en muebles", v:30},
      ]},
      { key:"terapia_iv", label:"Terapia IV / heparina", options:[ {t:"No", v:0}, {t:"Sí", v:20} ] },
      { key:"marcha", label:"Marcha", options:[
        {t:"Normal / reposo / silla de ruedas", v:0},
        {t:"Débil", v:10},
        {t:"Limitada", v:20},
      ]},
      { key:"estado_mental", label:"Estado mental", options:[
        {t:"Reconoce sus limitaciones", v:0},
        {t:"Olvida/sobreestima limitaciones", v:15},
      ]},
    ],
    evaluate: (score) => {
      if (score <= 24) return { level:"Bajo", color:"green", strip:"Riesgo bajo de caídas.", rec:"Mantener medidas estándar y educación al paciente." };
      if (score <= 50) return { level:"Medio", color:"yellow", strip:"Riesgo medio de caídas.", rec:"Implementar plan preventivo: barandas según protocolo, acompañamiento y señalización." };
      return { level:"Alto", color:"red", strip:"Alto riesgo de caídas detectado.", rec:"Medidas intensivas: vigilancia aumentada, ayudas técnicas y reevaluación frecuente." };
    }
  },

  ginebra: {
    name: "Escala de Ginebra",
    fields: [
      { key:"edad", label:"Edad > 65 años", options:[ {t:"No", v:0}, {t:"Sí", v:1} ] },
      { key:"tvp_tep", label:"TVP/TEP previo", options:[ {t:"No", v:0}, {t:"Sí", v:3} ] },
      { key:"cirugia", label:"Cirugía/fractura < 1 mes", options:[ {t:"No", v:0}, {t:"Sí", v:2} ] },
      { key:"malignidad", label:"Malignidad activa", options:[ {t:"No", v:0}, {t:"Sí", v:2} ] },
      { key:"dolor", label:"Dolor unilateral MMII", options:[ {t:"No", v:0}, {t:"Sí", v:3} ] },
      { key:"hemoptisis", label:"Hemoptisis", options:[ {t:"No", v:0}, {t:"Sí", v:2} ] },
      { key:"fc", label:"Frecuencia cardíaca", options:[
        {t:"< 75 lpm", v:0},
        {t:"75–94 lpm", v:3},
        {t:"> 95 lpm", v:5},
      ]},
      { key:"palpacion", label:"Dolor palpación venas profundas / edema unilateral", options:[ {t:"No", v:0}, {t:"Sí", v:4} ] },
    ],
    evaluate: (score) => {
      if (score < 4) return { level:"Baja", color:"green", strip:"Probabilidad clínica baja.", rec:"Continuar evaluación clínica y considerar pruebas según protocolo institucional." };
      if (score <= 10) return { level:"Intermedia", color:"yellow", strip:"Probabilidad clínica intermedia.", rec:"Considerar estudios complementarios (p. ej., dímero D / imagen) según protocolo." };
      return { level:"Alta", color:"red", strip:"Probabilidad clínica alta.", rec:"Priorizar evaluación médica y estudios diagnósticos inmediatos según protocolo." };
    }
  }
};

function show(which){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[which].classList.add("active");
}

function goHome(){
  currentScale = null;
  formFields.innerHTML = "";
  show("home");
}

function openScale(scaleKey){
  currentScale = scaleKey;
  const scale = SCALES[scaleKey];
  formTitle.textContent = scale.name;

  // render fields
  formFields.innerHTML = scale.fields.map((f, idx) => {
    const name = `q_${f.key}`;
    const options = f.options.map((o, i) => `
      <label class="radioPill">
        <input type="radio" name="${name}" value="${o.v}" ${i===0 ? "checked" : ""} />
        <span>${o.t}</span>
      </label>
    `).join("");

    return `
      <div class="field">
        <div class="fieldLabel">${f.label}</div>
        <div class="optRow">${options}</div>
      </div>
    `;
  }).join("");

  show("form");
}

function getScore(){
  const scale = SCALES[currentScale];
  let total = 0;

  scale.fields.forEach(f => {
    const name = `q_${f.key}`;
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    total += parseInt(selected.value, 10);
  });

  return total;
}

function setResultUI(score, result){
  scoreValue.textContent = score;
  riskLabel.textContent = `Riesgo ${result.level}`;
  recText.textContent = result.rec;

  badge.classList.remove("red","yellow","green");
  riskStrip.classList.remove("red","yellow","green");

  badge.classList.add(result.color);
  riskStrip.classList.add(result.color);
  riskStrip.textContent = result.strip;
}

function calculate(){
  if(!currentScale) return;

  const scale = SCALES[currentScale];
  const score = getScore();
  const result = scale.evaluate(score);

  setResultUI(score, result);
  show("result");
}
