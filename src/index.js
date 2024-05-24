const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { exec } = require('child_process');

if (require('electron-squirrel-startup')) {
  app.quit();
}
 
let mainWindow;
const createWindow = () => {
   mainWindow = new BrowserWindow({
    width: 1080,
    height: 650,
    webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.webContents.on("did-finish-load", () => {
    const dataProc = procesosGlobal;
    mainWindow.webContents.send("fromMain", dataProc);
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

if (process.env.NODE_ENV !== "production") {
  require("electron-reloader")(module);
  electron: path.join(__dirname, "../node_modules", ".bin", "electron");
}

let authValue;
let values = null;
let procesosGlobal;
let globalCatalogo = { cod: null, nom: null };

ipcMain.on("selectmemory", (event, auth) => {
  console.log("\n" + "Numero de procesos RAM: ===========> " + auth);
  authValue = auth
  getProcessByMaxMemoryUsage(authValue);
})

ipcMain.on("selectcpu", (event, auth) => {
  console.log("\n" + "Numero de procesos CPU: ===========> " + auth);
  authValue = auth
  getProcessByMaxCPUUsage(authValue);
})

function getProcessByMaxMemoryUsage(numeroDeProcesos) {
  exec("tasklist /fo csv /nh /v", { encoding: 'UTF-8' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar el comando: ${error}`);
      return;
    }

    const lineas = stdout.trim().split("\n");
    const procesos = lineas
      .map((linea) => {
        const campos = linea.split('","');
        return {
          pid: parseInt(campos[1].replace(/,/g, ""), 10),
          nombre: campos[0].replace(/^"|"$/g, ""),
          usuario: campos[6].replace(/^"|"$/g, ""),
          descripcion: campos[8].replace(/^"|"$/g, ""),
          memoria: parseInt(campos[4].replace(/,/g, ""), 10),
          prioridad: campos[6].replace(/^"|"$/g, "") !== "DESKTOP-CK47KEL\\cueto" ? 1 : 0,
        };
      })
      .sort((a, b) => b.memoria - a.memoria)
      .slice(0, numeroDeProcesos);

      procesosGlobal = procesos.map(proceso => {
        return{PID: proceso.pid, Nombre: proceso.nombre, Usuario: proceso.usuario, Descripcion: proceso.descripcion.slice(0, [proceso.descripcion.length - 2]), Prioridad: proceso.prioridad}
      })
      
      values = procesos.map(proceso => [proceso.pid, proceso.nombre, proceso.usuario, proceso.descripcion, proceso.prioridad])
      mainWindow.reload();
  });
}

function getProcessByMaxCPUUsage(numeroDeProcesos) {
  exec("tasklist /fo csv /nh /v", { encoding: 'UTF-8' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar el comando: ${error}`);
      return;
    }

    const lineas = stdout.trim().split("\n");
    const procesos = lineas
      .map((linea) => {
        const campos = linea.split('","');
        return {
          pid: parseInt(campos[1].replace(/,/g, ""), 10),
          nombre: campos[0].replace(/^"|"$/g, ""),
          usuario: campos[6].replace(/^"|"$/g, ""),
          descripcion: campos[8].replace(/^"|"$/g, ""),
          tiempocpu: parseInt(campos[7].replace(/,/g, ""), 10),
          prioridad: campos[6].replace(/^"|"$/g, "") !== "DESKTOP-CK47KEL\\cueto" ? 1 : 0,
        };
      })
      .sort((a, b) => b.tiempocpu - a.tiempocpu)
      .slice(0, numeroDeProcesos);

    procesosGlobal = procesos.map(proceso => {
      return{PID: proceso.pid, Nombre: proceso.nombre, Usuario: proceso.usuario, Descripcion: proceso.descripcion.slice(0, [proceso.descripcion.length - 2]), Prioridad: proceso.prioridad}
    })

    values = procesos.map(proceso => [proceso.pid, proceso.nombre, proceso.usuario, proceso.descripcion, proceso.prioridad])
    mainWindow.reload();
  });
}

ipcMain.on("catalogo", (event, cat) => {
  const { codigo, nombre } = cat;
  globalCatalogo.cod = codigo;
  globalCatalogo.nom = nombre;
  console.log(globalCatalogo.cod, globalCatalogo.nom);

  if (
    !values ||
    (typeof values.length !== "undefined" && values.length === 0)
  ) {
    event.sender.send(
      "alert-message",
      "Primero hay que hacer una captura de procesos!"
    );
    return;
  }

  getDataFromCatalogue().then(() => {
    message = checkIfIdRegistered(globalCatalogo.cod);
    if (message) {
      console.log("Alerta:", message);
      event.sender.send("alert-message", message);
    } else {
      insertData(globalCatalogo, values);
    }
  });
});


async function insertData(globalCatalogo, valuesGlobal) {
  let catalogueResponse = await fetch('http://localhost:3000/catalogue', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          id: globalCatalogo.cod,
          name: globalCatalogo.nom
      })
  });

  if (!catalogueResponse.ok) {
      console.error('Error al insertar en catalogue:', await catalogueResponse.json());
      return;
  }
  console.log('Datos insertados en catalogue:', await catalogueResponse.json());

  let processesPromises = values.map(valueg => {
      let [pid, nombre, usuario, descripcion, prioridad] = valueg;
      return fetch('http://localhost:3000/processes', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              PID: pid,
              name: nombre,
              user: usuario,
              description: descripcion,
              priority: prioridad,
              id_catalogue: globalCatalogo.cod
          })
      });
  });

  let processesResponses = await Promise.all(processesPromises);

  processesResponses.forEach(async (response, index) => {
      if (!response.ok) {
          console.error('Error al insertar los procesos:', await response.json());
      } else {
          console.log('Procesos insertados:', await response.json());
      }
  });
}

let globalCatalogueIds = [];
let message;

async function getDataFromCatalogue() {
  try {
    let catalogueResponse = await fetch('http://localhost:3000/catalogue', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!catalogueResponse.ok) {
      console.error('Error al obtener datos de catalogue:', await catalogueResponse.json());
      return;
    }

    let catalogueData = await catalogueResponse.json();

    if (catalogueData.length > 0) {
      globalCatalogueIds = catalogueData.map(item => item.id);
    } else {
      console.log('No se encontraron datos en la tabla catalogue');
    }

    return catalogueData;

  } catch (error) {
    console.error('Error en la solicitud de fetch:', error);
  }
}

function checkIfIdRegistered(id) {
  console.log('Verificando si el ID >>-->', id, '<--<<esta registrado');
  const idStr = id.toString();
  if (globalCatalogueIds.map(id => id.toString()).includes(idStr)) {
    return 'Ingresa otro ID, este ya esta registrado!';
  }
}


