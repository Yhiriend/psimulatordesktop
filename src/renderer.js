var numeroDeProcesos;
let globalData = null;

document.getElementById("selector-memory").addEventListener("change", function (event) {
    numeroDeProcesos = document.getElementById("numbercapture").value;
    console.log("Procesos en memoria", numeroDeProcesos);
    if (numeroDeProcesos !== "") {
      window.apiMemory.sendAuth(numeroDeProcesos);
    }
  });

document.getElementById("selector-cpu").addEventListener("change", function (event) {
    numeroDeProcesos = document.getElementById("numbercapture").value;
    console.log("Procesos en cpu", numeroDeProcesos);
    if (numeroDeProcesos !== "") {
      window.apiCPU.sendAuth(numeroDeProcesos);
    }
  });

  document.getElementById("sender-cataolgue").addEventListener("submit", function (event) {
    event.preventDefault();

    let codigoCatalogo = document.getElementById("a").value;
    let nombreCatalogo = document.getElementById("b").value;
      if (codigoCatalogo === "") {
        document.getElementById("a").setCustomValidity("Este campo es requerido.");
      }
      if (nombreCatalogo === "") {
        document.getElementById("b").setCustomValidity("Este campo es requerido.");
      }
      document.getElementById("a").reportValidity();
      document.getElementById("b").reportValidity();

  });

  document.getElementById("buttonsave").addEventListener("click", function (event) {
    let codigoCatalogo = document.getElementById("a").value;
    let nombreCatalogo = document.getElementById("b").value;
    const catalogo = { codigo: codigoCatalogo, nombre: nombreCatalogo };
    console.log("Datos catalogo", catalogo);
    if (codigoCatalogo !== "" && nombreCatalogo !== "") {
      window.apiCatalogo.sendCatalogue(catalogo);
      document.getElementById("a").value = "";
      document.getElementById("b").value = "";
    }
    receiveAlert();
  });

  document.getElementById("a").addEventListener("input", function () {
    this.setCustomValidity('');
    this.reportValidity();
  });

  function receiveAlert(){
    const inputElement = document.getElementById('a');
    window.apiReportIDC.receiveValidationId((message) => {
      inputElement.setCustomValidity(message);
      inputElement.reportValidity();
    });
  }

function toggleCheckboxes(checkbox) {
  if (checkbox.id === "selector-memory" && checkbox.checked) {
    document.getElementById("selector-cpu").checked = false;
    validateCheckboxes();
  } else if (checkbox.id === "selector-cpu" && checkbox.checked) {
    document.getElementById("selector-memory").checked = false;
    validateCheckboxes();
  }
}

function validateCheckboxes() {
  const numberInput = document.getElementById('numbercapture');
  const memoryCheckbox = document.getElementById('selector-memory');
  const cpuCheckbox = document.getElementById('selector-cpu');

  if ((memoryCheckbox.checked || cpuCheckbox.checked) && !numberInput.value) {
      numberInput.setCustomValidity('Completa este campo');
      numberInput.reportValidity();
  }
}

window.apiProcesses.receive("fromMain", (data) => {
  globalData = data;
  displayProcesses(globalData)
});

function displayProcesses(dataP) {
  const tableBody = document.getElementById("processesTableBody");

  dataP.forEach((process) => {
    const row = document.createElement("tr");

    Object.values(process).forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });
}
