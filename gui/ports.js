'use strict'
/* global Elm */ // This will keep your linter happy

const ipcRenderer = require('electron').ipcRenderer
const remote = require('remote')
const shell = require('electron').shell

const path = remote.require('path-extra')
const pkg = remote.require('./package.json')
const defaultDir = path.join(path.homedir(), 'Cozy')
const container = document.getElementById('container')
const elmectron = Elm.embed(Elm.Main, container, {
  folder: '',
  registration: [],
  registrationError: '',
  synchonization: '',
  unlink: [],
  version: pkg.version
})

// Glue code between Elm and the main process
elmectron.ports.folder.send(defaultDir)
ipcRenderer.on('folder-chosen', (event, folder) => {
  elmectron.ports.folder.send(folder)
})
elmectron.ports.chooseFolder.subscribe(() => {
  ipcRenderer.send('choose-folder')
})

ipcRenderer.on('remote-error', (event, err) => {
  elmectron.ports.registrationError.send(err)
})
ipcRenderer.on('remote-registered', (event) => {
  elmectron.ports.registration.send([])
})
elmectron.ports.registerRemote.subscribe((remote) => {
  ipcRenderer.send('register-remote', {
    url: remote[0],
    password: remote[1]
  })
})

ipcRenderer.on('synchronization', (event, url) => {
  elmectron.ports.synchonization.send(url)
})
elmectron.ports.startSync.subscribe((folder) => {
  ipcRenderer.send('start-sync', folder)
})

ipcRenderer.on('unlinked', (event) => {
  elmectron.ports.unlink.send([])
})
elmectron.ports.unlinkCozy.subscribe(() => {
  ipcRenderer.send('unlink-cozy')
})

// Open external links in the browser
function tryToOpenExternalLink (event, target) {
  if (target && target.matches('a[href^="https"]')) {
    event.preventDefault()
    shell.openExternal(target.href)
  }
}
document.addEventListener('click', (event) => {
  tryToOpenExternalLink(event, event.target)
  tryToOpenExternalLink(event, event.target.parentElement)
})

// Give focus to DOM nodes
elmectron.ports.focus.subscribe((selector) => {
  // We wait that the CSS transition has finished before focusing the node
  setTimeout(() => {
    const nodes = document.querySelectorAll(selector)
    if (nodes && nodes.length > 0) {
      nodes[0].focus()
    }
  }, 300)
})