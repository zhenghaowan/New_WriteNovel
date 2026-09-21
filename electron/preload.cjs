const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("inkpress", {
  isDesktop: true,
  openOfficialReader: (url) => ipcRenderer.invoke("inkpress:open-official-reader", url),
});
