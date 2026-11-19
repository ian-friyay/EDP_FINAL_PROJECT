import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/neumorphism.css'
import './index.css'
import App from './App.jsx'
import { initServiceWorkerPush } from './utils/pushNotification'

initServiceWorkerPush();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
