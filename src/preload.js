const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("apiMemory", {
  sendAuth: (auth) => ipcRenderer.send("selectmemory", auth),
});

contextBridge.exposeInMainWorld("apiCPU", {
  sendAuth: (auth) => ipcRenderer.send("selectcpu", auth),
});

contextBridge.exposeInMainWorld("apiCatalogo", {
  sendCatalogue: (cat) => ipcRenderer.send("catalogo", cat),
});

contextBridge.exposeInMainWorld("apiReportIDC", {
  receiveValidationId: (callback) => ipcRenderer.on("alert-message", (event, idc) => callback(idc)),
});

contextBridge.exposeInMainWorld("apiProcesses", {
  receive: (channel, func) => {
    const validChannels = ["fromMain"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => {
        console.log("Data received from main process:", ...args);
        func(...args);
      });
    }
  },
});
