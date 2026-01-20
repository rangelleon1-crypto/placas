const { chromium } = require('playwright');
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuración de tiempos optimizados (milisegundos)
const WAIT_TIMES = {
  short: 300,
  medium: 800,
  long: 1100,
  xlong: 1800,
  xxlong: 2000
};

// Configuración del proxy desde variables de entorno
const PROXY_CONFIG = {
  server: process.env.PROXY_SERVER || 'http://rko4yuebgb.cn.fxdx.in:17313',
  username: process.env.PROXY_USERNAME || '1Q2W3E4R5T6B',
  password: process.env.PROXY_PASSWORD || '1LEREGAZA89re89'
};

const EMAIL = process.env.EMAIL || 'hdhdhd78@gmail.com';

// Variable para controlar solicitudes simultáneas
let isProcessing = false;
let requestQueue = 0;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para esperar con timeout
async function waitForElement(page, selector, timeout = 15000) {
  try {
    await page.waitForSelector(selector, { 
      state: 'visible', 
      timeout 
    });
    return true;
  } catch (error) {
    console.log(`❌ Elemento no encontrado: ${selector}`);
    return false;
  }
}

// Función para esperar elemento por rol
async function waitForRole(page, role, name, timeout = 15000) {
  try {
    const locator = page.getByRole(role, { name });
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  } catch (error) {
    console.log(`❌ Elemento por rol no encontrado: ${role} - ${name}`);
    return null;
  }
}

// Función para esperar elemento por placeholder
async function waitForPlaceholder(page, placeholder, timeout = 15000) {
  try {
    const locator = page.locator(`[placeholder*="${placeholder}"]`);
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  } catch (error) {
    console.log(`❌ Elemento por placeholder no encontrado: ${placeholder}`);
    return null;
  }
}

// Función para extraer valores monetarios de texto
function extractMonetaryValue(text, patterns) {
  // Buscar patrones como $1,234.56 o -$123.45
  const moneyRegex = /-?\$\s*[\d,]+\.?\d*/g;
  const matches = text.match(moneyRegex);
  
  if (matches && matches.length > 0) {
    // Tomar el último valor encontrado (normalmente es el monto)
    return matches[matches.length - 1].trim();
  }
  
  return 'No disponible';
}

async function runAutomation(placa) {
  const browser = await chromium.launch({ 
    headless: true,
    proxy: PROXY_CONFIG,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--disable-accelerated-2d-canvas',
      '--disable-web-security',
      '--disable-features=site-per-process',
      `--proxy-server=${PROXY_CONFIG.server}`
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    proxy: PROXY_CONFIG
  });
  
  const page = await context.newPage();
  
  try {
    console.log(`🔗 Conectando con proxy: ${PROXY_CONFIG.server}...`);
    
    // Navegar a la página con espera hasta que cargue completamente
    console.log('🌐 Navegando al sitio oficial...');
    await page.goto('https://icvnl.gob.mx:1080/estadoctav3/edoctaconsulta#no-back-button', {
      waitUntil: 'networkidle',
      timeout: 45000
    });
    
    console.log('✅ Página cargada. Esperando elementos...');
    await delay(WAIT_TIMES.medium);
    
    // ESPERA INTELIGENTE 1: Checkbox de términos
    console.log('⏳ Esperando checkbox de términos...');
    const checkboxTerminos = await waitForRole(page, 'checkbox', 'Acepto bajo protesta de decir', 20000);
    
    if (!checkboxTerminos) {
      // Intentar método alternativo
      const terminosAlt = await page.locator('input[type="checkbox"]').first();
      if (await terminosAlt.isVisible()) {
        await terminosAlt.check();
        console.log('✅ Checkbox de términos encontrado (método alternativo)');
      } else {
        throw new Error('No se pudo encontrar el checkbox de términos después de 20 segundos');
      }
    } else {
      await checkboxTerminos.check();
      console.log('✅ Checkbox de términos aceptado');
    }
    
    await delay(WAIT_TIMES.short);
    
    // ESPERA INTELIGENTE 2: Campo de placa
    console.log('⏳ Esperando campo de placa...');
    const campoPlaca = await waitForRole(page, 'textbox', 'Placa', 15000);
    
    if (!campoPlaca) {
      // Intentar método alternativo por placeholder
      const placaAlt = await waitForPlaceholder(page, 'Placa', 10000);
      if (placaAlt) {
        await placaAlt.click();
        await placaAlt.fill(placa);
        console.log('✅ Placa ingresada (método alternativo)');
      } else {
        throw new Error('No se pudo encontrar el campo de placa');
      }
    } else {
      await campoPlaca.click();
      await campoPlaca.fill(placa);
      console.log(`✅ Placa ${placa} ingresada`);
    }
    
    await delay(WAIT_TIMES.short);
    
    // ESPERA INTELIGENTE 3: Div para activar JavaScript
    console.log('⏳ Esperando elemento div para activación...');
    try {
      // Esperar a que el div esté disponible
      await page.waitForSelector('div:nth-child(4)', { 
        state: 'visible', 
        timeout: 15000 
      });
      await page.locator('div:nth-child(4)').click();
      console.log('✅ Elemento div activado');
    } catch (error) {
      console.log('⚠️  No se encontró el div específico, continuando...');
    }
    
    await delay(WAIT_TIMES.long);
    
    // ESPERA INTELIGENTE 4: Botón de consultar
    console.log('⏳ Esperando botón de consultar...');
    const botonConsultar = await waitForRole(page, 'button', 'Consultar', 15000);
    
    if (!botonConsultar) {
      // Intentar selector alternativo
      const consultarAlt = page.locator('button:has-text("Consultar")');
      if (await consultarAlt.isVisible()) {
        await consultarAlt.click();
        console.log('✅ Botón de consultar clickeado (método alternativo)');
      } else {
        throw new Error('No se pudo encontrar el botón de consultar');
      }
    } else {
      await botonConsultar.click();
      console.log('✅ Botón de consultar clickeado');
    }
    
    await delay(WAIT_TIMES.xlong);
    
    // ESPERA INTELIGENTE 5: CAPTCHA (si aparece)
    console.log('⏳ Verificando captcha...');
    try {
      // Esperar a que aparezca el captcha con timeout más corto
      await page.waitForSelector('input[name="robot"], input[type="checkbox"]', { 
        state: 'visible', 
        timeout: 10000 
      });
      
      const captchaCheckbox = await waitForRole(page, 'checkbox', 'No soy un robot', 8000);
      if (captchaCheckbox) {
        await captchaCheckbox.check();
        console.log('✅ Captcha resuelto');
      }
    } catch (error) {
      console.log('✅ No se encontró captcha o ya estaba resuelto');
    }
    
    await delay(WAIT_TIMES.long);
    
    // ESPERA INTELIGENTE 6: Campo de email (con verificación de habilitado)
    console.log('⏳ Esperando campo de email habilitado...');
    
    // Primero esperar a que el campo exista
    let campoEmail = null;
    const maxRetries = 10;
    let retryCount = 0;
    
    while (!campoEmail && retryCount < maxRetries) {
      campoEmail = await waitForRole(page, 'textbox', 'Email', 5000);
      
      if (!campoEmail) {
        // Intentar por placeholder
        campoEmail = await waitForPlaceholder(page, 'Email', 3000);
      }
      
      if (campoEmail) {
        // Verificar si está habilitado
        const isEnabled = await campoEmail.isEnabled();
        if (isEnabled) {
          console.log('✅ Campo de email habilitado encontrado');
          break;
        } else {
          console.log('⚠️  Campo de email encontrado pero deshabilitado, esperando...');
          campoEmail = null;
          await delay(1000);
        }
      } else {
        console.log(`⏳ Intento ${retryCount + 1}/${maxRetries}: Campo de email no encontrado, reintentando...`);
        await delay(1000);
      }
      
      retryCount++;
    }
    
    if (!campoEmail) {
      throw new Error('No se pudo encontrar el campo de email después de 10 intentos');
    }
    
    await campoEmail.click();
    await campoEmail.fill(EMAIL);
    console.log(`✅ Email ${EMAIL} ingresado`);
    
    await delay(WAIT_TIMES.short);
    
    // ESPERA INTELIGENTE 7: Botón de ver estado de cuenta
    console.log('⏳ Esperando botón "Ver estado de cuenta"...');
    const botonVerEstado = await waitForRole(page, 'button', 'Ver estado de cuenta', 15000);
    
    if (!botonVerEstado) {
      // Intentar selector alternativo
      const verEstadoAlt = page.locator('button:has-text("Ver estado de cuenta")');
      if (await verEstadoAlt.isVisible()) {
        await verEstadoAlt.click();
        console.log('✅ Botón "Ver estado de cuenta" clickeado (método alternativo)');
      } else {
        throw new Error('No se pudo encontrar el botón "Ver estado de cuenta"');
      }
    } else {
      await botonVerEstado.click();
      console.log('✅ Botón "Ver estado de cuenta" clickeado');
    }
    
    console.log('⏳ Cargando resultados...');
    await delay(WAIT_TIMES.xxlong);
    
    // ESPERA INTELIGENTE 8: Verificar que los resultados cargaron
    console.log('⏳ Verificando carga de resultados...');
    try {
      // Esperar a que aparezca algún contenido relevante
      await page.waitForSelector('body', { 
        state: 'visible', 
        timeout: 10000 
      });
      
      // Esperar contenido específico de resultados
      const tieneResultados = await page.evaluate(() => {
        const bodyText = document.body.textContent;
        return bodyText.includes('Marca:') || 
               bodyText.includes('Modelo:') || 
               bodyText.includes('TOTAL') || 
               bodyText.includes('SUBTOTAL');
      });
      
      if (!tieneResultados) {
        console.log('⚠️  No se detectaron patrones de resultados, continuando...');
      } else {
        console.log('✅ Resultados detectados');
      }
    } catch (error) {
      console.log('⚠️  No se pudo verificar resultados específicos, continuando con extracción...');
    }
    
    // Extraer datos limpios
    const pageContent = await page.textContent('body');
    const lines = pageContent.split('\n').map(line => line.trim()).filter(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return false;
      const exclusionPatterns = [
        'Selecciona el metodo de pago:',
        'Tarjeta de Crédito/Débito',
        'Línea de Referencia Bancaria',
        'Te redireccionaremos',
        'Favor de tener habilitados',
        'Cerrar',
        'get_ip',
        'CDATA',
        '$(\'#modalCargar\')',
        '//<![CDATA[',
        '//]]>',
        'function get_ip'
      ];
      return !exclusionPatterns.some(pattern => trimmedLine.includes(pattern));
    });
    
    // Procesar información del vehículo
    let vehicleInfo = [];
    let charges = [];
    let totalAPagar = '';
    let subtotal = '';
    
    // Variables para los nuevos campos solicitados
    let subsidioRefrendo = { encontrado: false, texto: '', valor: '' };
    let donativoCruzRoja = { encontrado: false, texto: '', valor: '' };
    let donativoBomberos = { encontrado: false, texto: '', valor: '' };
    
    // Encontrar información del vehículo
    const vehicleKeywords = ['Marca:', 'Modelo:', 'Linea:', 'Tipo:', 'Color:', 'NIV:'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Capturar información del vehículo
      if (line.includes('Marca:')) {
        vehicleInfo.push('Marca:');
        if (i + 1 < lines.length && lines[i + 1].trim() && !lines[i + 1].includes(':')) {
          vehicleInfo.push(lines[i + 1]);
        }
      } else if (line.includes('Modelo:')) {
        vehicleInfo.push('Modelo:');
        if (i + 1 < lines.length && lines[i + 1].trim() && !lines[i + 1].includes(':')) {
          vehicleInfo.push(lines[i + 1]);
        }
      } else if (line.includes('Linea:')) {
        vehicleInfo.push('Linea:');
        if (i + 1 < lines.length && lines[i + 1].trim() && !lines[i + 1].includes(':')) {
          vehicleInfo.push(lines[i + 1]);
        }
      } else if (line.includes('Tipo:')) {
        vehicleInfo.push('Tipo:');
        if (i + 1 < lines.length && lines[i + 1].trim() && !lines[i + 1].includes(':')) {
          vehicleInfo.push(lines[i + 1]);
        }
      } else if (line.includes('Color:')) {
        vehicleInfo.push('Color:');
        if (i + 1 < lines.length && lines[i + 1].trim() && !lines[i + 1].includes(':')) {
          vehicleInfo.push(lines[i + 1]);
        }
      } else if (line.includes('NIV:')) {
        vehicleInfo.push('NIV:');
        if (i + 1 < lines.length && lines[i + 1].trim() && !lines[i + 1].includes(':')) {
          vehicleInfo.push(lines[i + 1]);
        }
      }
      
      // Capturar cargos
      if (line.match(/\d{4}\s+\$/)) {
        charges.push(line);
      }
      
      // Capturar subtotal
      if (line.includes('SUBTOTAL') && !subtotal) {
        subtotal = line;
      }
      
      // Capturar total a pagar
      if ((line.includes('TOTAL A PAGAR') || line.match(/TOTAL.*PAGAR/i)) && !totalAPagar) {
        totalAPagar = line;
      }
      
      // 🔍 BUSCAR SUBSIDIO REFRENDO PRONTO PAGO
      if (line.match(/SUBSIDIO.*REF.*ENDO.*PRONTO.*PAGO/i) || 
          line.match(/SUBSIDIO.*PRONTO.*PAGO/i) ||
          line.includes('SUBSIDIO REFRENDO PRONTO PAGO')) {
        subsidioRefrendo.encontrado = true;
        subsidioRefrendo.texto = line;
        
        // Intentar extraer el valor monetario de esta línea
        subsidioRefrendo.valor = extractMonetaryValue(line);
        
        // Si no se encontró valor en esta línea, verificar la siguiente
        if (subsidioRefrendo.valor === 'No disponible' && i + 1 < lines.length) {
          subsidioRefrendo.valor = extractMonetaryValue(lines[i + 1]);
        }
        
        console.log(`✅ Subsidio encontrado: ${line}`);
      }
      
      // 🔍 BUSCAR DONATIVOS PARA CRUZ ROJA
      if (line.match(/DONATIVO.*CRUZ.*ROJA/i) || 
          line.match(/DONATIVOS.*CRUZ.*ROJA/i) ||
          line.includes('DONATIVOS PARA CRUZ ROJA') ||
          line.includes('DONATIVO CRUZ ROJA')) {
        donativoCruzRoja.encontrado = true;
        donativoCruzRoja.texto = line;
        
        // Intentar extraer el valor monetario de esta línea
        donativoCruzRoja.valor = extractMonetaryValue(line);
        
        // Si no se encontró valor en esta línea, verificar la siguiente
        if (donativoCruzRoja.valor === 'No disponible' && i + 1 < lines.length) {
          donativoCruzRoja.valor = extractMonetaryValue(lines[i + 1]);
        }
        
        console.log(`✅ Donativo Cruz Roja encontrado: ${line}`);
      }
      
      // 🔍 BUSCAR DONATIVOS PARA PAT. DE BOMBEROS
      if (line.match(/DONATIVO.*BOMBERO/i) || 
          line.match(/DONATIVOS.*BOMBERO/i) ||
          line.match(/DONATIVO.*PAT.*BOMBERO/i) ||
          line.includes('DONATIVOS PARA PAT. DE BOMBEROS') ||
          line.includes('DONATIVO BOMBEROS')) {
        donativoBomberos.encontrado = true;
        donativoBomberos.texto = line;
        
        // Intentar extraer el valor monetario de esta línea
        donativoBomberos.valor = extractMonetaryValue(line);
        
        // Si no se encontró valor en esta línea, verificar la siguiente
        if (donativoBomberos.valor === 'No disponible' && i + 1 < lines.length) {
          donativoBomberos.valor = extractMonetaryValue(lines[i + 1]);
        }
        
        console.log(`✅ Donativo Bomberos encontrado: ${line}`);
      }
    }
    
    // Si aún no encontramos los valores específicos, buscar en todo el contenido
    if (!subsidioRefrendo.encontrado) {
      const subsidioRegex = /SUBSIDIO.*REF.*ENDO.*PRONTO.*PAGO[^$]*(\$[\d,.]+)/i;
      const match = pageContent.match(subsidioRegex);
      if (match && match[1]) {
        subsidioRefrendo.encontrado = true;
        subsidioRefrendo.texto = match[0].trim();
        subsidioRefrendo.valor = match[1].trim();
      }
    }
    
    if (!donativoCruzRoja.encontrado) {
      const cruzRojaRegex = /DONATIVO.*CRUZ.*ROJA[^$]*(\$[\d,.]+)/i;
      const match = pageContent.match(cruzRojaRegex);
      if (match && match[1]) {
        donativoCruzRoja.encontrado = true;
        donativoCruzRoja.texto = match[0].trim();
        donativoCruzRoja.valor = match[1].trim();
      }
    }
    
    if (!donativoBomberos.encontrado) {
      const bomberosRegex = /DONATIVO.*BOMBERO[^$]*(\$[\d,.]+)/i;
      const match = pageContent.match(bomberosRegex);
      if (match && match[1]) {
        donativoBomberos.encontrado = true;
        donativoBomberos.texto = match[0].trim();
        donativoBomberos.valor = match[1].trim();
      }
    }
    
    // Si aún no hay total, buscar en el contenido completo
    if (!totalAPagar) {
      const totalMatch = pageContent.match(/TOTAL\s*A\s*PAGAR[^$\n]*\$?\s*[\d,]+\.?\d*/gi);
      if (totalMatch && totalMatch.length > 0) {
        totalAPagar = totalMatch[0].trim();
      }
    }
    
    // Preparar estructura de datos de subsidios y donativos
    const subsidiosDonativos = {
      subsidioRefrendoProntoPago: {
        encontrado: subsidioRefrendo.encontrado,
        descripcion: subsidioRefrendo.encontrado ? subsidioRefrendo.texto : 'No encontrado',
        valor: subsidioRefrendo.encontrado ? subsidioRefrendo.valor : 'No disponible'
      },
      donativoCruzRoja: {
        encontrado: donativoCruzRoja.encontrado,
        descripcion: donativoCruzRoja.encontrado ? donativoCruzRoja.texto : 'No encontrado',
        valor: donativoCruzRoja.encontrado ? donativoCruzRoja.valor : 'No disponible'
      },
      donativoBomberos: {
        encontrado: donativoBomberos.encontrado,
        descripcion: donativoBomberos.encontrado ? donativoBomberos.texto : 'No encontrado',
        valor: donativoBomberos.encontrado ? donativoBomberos.valor : 'No disponible'
      }
    };
    
    return {
      placa,
      vehiculo: vehicleInfo.filter(line => line && line.trim()),
      cargos: charges.length > 0 ? charges : ['No se encontraron cargos'],
      subtotal: subtotal || 'SUBTOTAL: No disponible',
      totalAPagar: totalAPagar || 'TOTAL A PAGAR: No disponible',
      subsidiosYdonativos: subsidiosDonativos,
      resumenFinanciero: {
        subtotal: subtotal || 'No disponible',
        totalAPagar: totalAPagar || 'No disponible',
        desglose: {
          subsidioRefrendo: subsidioRefrendo.encontrado ? subsidioRefrendo.valor : 'No aplica',
          donativoCruzRoja: donativoCruzRoja.encontrado ? donativoCruzRoja.valor : 'No aplica',
          donativoBomberos: donativoBomberos.encontrado ? donativoBomberos.valor : 'No aplica'
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error durante la automatización:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    await browser.close();
    console.log('🔒 Navegador cerrado');
  }
}

// Middleware para verificar solicitudes simultáneas
function checkSimultaneousRequests(req, res, next) {
  requestQueue++;
  console.log(`📊 Solicitudes en cola: ${requestQueue}`);
  
  if (isProcessing) {
    requestQueue--;
    console.log(`❌ Solicitud rechazada - Ya hay una consulta en proceso`);
    return res.status(429).json({
      error: 'sin respuesta',
      mensaje: 'El sistema está procesando otra consulta. Intente nuevamente en unos momentos.',
      estado: 'ocupado'
    });
  }
  
  isProcessing = true;
  console.log(`✅ Solicitud aceptada - Iniciando proceso`);
  
  next();
}

// Endpoints de la API
app.get('/', (req, res) => {
  res.json({
    message: 'API de consulta de estado de cuenta vehicular - Versión Completa',
    status: 'online',
    version: '3.0',
    caracteristicas: [
      'Esperas inteligentes por elemento',
      'Extracción de subsidios y donativos',
      'Búsqueda avanzada de patrones',
      'Estructura de datos mejorada'
    ],
    nuevos_campos: [
      'subsidiosYdonativos.subsidioRefrendoProntoPago',
      'subsidiosYdonativos.donativoCruzRoja',
      'subsidiosYdonativos.donativoBomberos',
      'resumenFinanciero.desglose'
    ],
    proxy: 'activado',
    solicitudes_simultaneas: '1 máximo',
    estado_actual: isProcessing ? 'procesando' : 'disponible',
    cola: requestQueue,
    endpoints: {
      consulta: 'GET /consulta?placa=ABC123',
      consultaPost: 'POST /consulta con JSON body { "placa": "ABC123" }',
      health: 'GET /health',
      consola: 'GET /consulta-consola/:placa'
    },
    ejemplo_respuesta_completa: {
      placa: "ABC123",
      vehiculo: ["Marca:", "TOYOTA", "Modelo:", "2025", "Linea:", "SIENNA HÍBRIDO"],
      cargos: ["2024 REFRENDO ANUAL $4,000.00"],
      subtotal: "SUBTOTAL MONTO SUBSIDIO: -$198.00",
      totalAPagar: "TOTAL A PAGAR: $3,802.00",
      subsidiosYdonativos: {
        subsidioRefrendoProntoPago: {
          encontrado: true,
          descripcion: "SUBSIDIO REFRENDO PRONTO PAGO -$198.00",
          valor: "-$198.00"
        },
        donativoCruzRoja: {
          encontrado: true,
          descripcion: "DONATIVOS PARA CRUZ ROJA $50.00",
          valor: "$50.00"
        },
        donativoBomberos: {
          encontrado: true,
          descripcion: "DONATIVOS PARA PAT. DE BOMBEROS $30.00",
          valor: "$30.00"
        }
      },
      resumenFinanciero: {
        subtotal: "SUBTOTAL MONTO SUBSIDIO: -$198.00",
        totalAPagar: "TOTAL A PAGAR: $3,802.00",
        desglose: {
          subsidioRefrendo: "-$198.00",
          donativoCruzRoja: "$50.00",
          donativoBomberos: "$30.00"
        }
      }
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    proxy: 'configurado',
    procesando: isProcessing,
    cola: requestQueue,
    service: 'consulta-vehicular-api-v3'
  });
});

app.get('/consulta', checkSimultaneousRequests, async (req, res) => {
  try {
    const { placa } = req.query;
    
    if (!placa) {
      isProcessing = false;
      requestQueue--;
      return res.status(400).json({
        error: 'Placa requerida. Ejemplo: /consulta?placa=ABC123'
      });
    }
    
    const placaLimpia = placa.trim().toUpperCase().replace(/\s+/g, '');
    
    if (!placaLimpia) {
      isProcessing = false;
      requestQueue--;
      return res.status(400).json({
        error: 'Placa requerida'
      });
    }
    
    const startTime = Date.now();
    console.log(`\n🚀 Iniciando consulta para placa: ${placaLimpia}`);
    console.log(`🔗 Usando proxy: ${PROXY_CONFIG.server}`);
    console.log(`🔍 Búsqueda activada para: SUBSIDIO, DONATIVO CRUZ ROJA, DONATIVO BOMBEROS`);
    
    const resultados = await runAutomation(placaLimpia);
    const tiempo = ((Date.now() - startTime) / 1000).toFixed(2);
    
    const respuesta = {
      ...resultados,
      tiempoConsulta: `${tiempo} segundos`,
      consultadoEn: new Date().toISOString(),
      metadata: {
        proxyUsado: PROXY_CONFIG.server,
        emailUsado: EMAIL,
        version: '3.0'
      }
    };
    
    console.log(`✅ Consulta completada en ${tiempo} segundos`);
    console.log(`📊 Resultados obtenidos:`);
    console.log(`   - Subsidio Refrendo: ${resultados.subsidiosYdonativos.subsidioRefrendoProntoPago.encontrado ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    console.log(`   - Donativo Cruz Roja: ${resultados.subsidiosYdonativos.donativoCruzRoja.encontrado ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    console.log(`   - Donativo Bomberos: ${resultados.subsidiosYdonativos.donativoBomberos.encontrado ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ Error en la consulta:', error);
    res.status(500).json({
      error: 'Error en la consulta',
      message: error.message,
      detalles: 'Verifique: 1. Conexión a internet, 2. Proxy disponible, 3. Placa correcta',
      timestamp: new Date().toISOString()
    });
  } finally {
    isProcessing = false;
    requestQueue--;
    console.log(`🔄 Sistema liberado. Estado: disponible`);
  }
});

app.post('/consulta', checkSimultaneousRequests, async (req, res) => {
  try {
    const { placa } = req.body;
    
    if (!placa) {
      isProcessing = false;
      requestQueue--;
      return res.status(400).json({
        error: 'Placa requerida en el body. Ejemplo: { "placa": "ABC123" }'
      });
    }
    
    const placaLimpia = placa.trim().toUpperCase().replace(/\s+/g, '');
    
    if (!placaLimpia) {
      isProcessing = false;
      requestQueue--;
      return res.status(400).json({
        error: 'Placa requerida'
      });
    }
    
    const startTime = Date.now();
    console.log(`\n🚀 Iniciando consulta para placa: ${placaLimpia}`);
    console.log(`🔗 Usando proxy: ${PROXY_CONFIG.server}`);
    console.log(`🔍 Búsqueda activada para: SUBSIDIO, DONATIVO CRUZ ROJA, DONATIVO BOMBEROS`);
    
    const resultados = await runAutomation(placaLimpia);
    const tiempo = ((Date.now() - startTime) / 1000).toFixed(2);
    
    const respuesta = {
      ...resultados,
      tiempoConsulta: `${tiempo} segundos`,
      consultadoEn: new Date().toISOString(),
      metadata: {
        proxyUsado: PROXY_CONFIG.server,
        emailUsado: EMAIL,
        version: '3.0'
      }
    };
    
    console.log(`✅ Consulta completada en ${tiempo} segundos`);
    console.log(`📊 Resultados obtenidos:`);
    console.log(`   - Subsidio Refrendo: ${resultados.subsidiosYdonativos.subsidioRefrendoProntoPago.encontrado ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    console.log(`   - Donativo Cruz Roja: ${resultados.subsidiosYdonativos.donativoCruzRoja.encontrado ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    console.log(`   - Donativo Bomberos: ${resultados.subsidiosYdonativos.donativoBomberos.encontrado ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ Error en la consulta:', error);
    res.status(500).json({
      error: 'Error en la consulta',
      message: error.message,
      detalles: 'Verifique: 1. Conexión a internet, 2. Proxy disponible, 3. Placa correcta',
      timestamp: new Date().toISOString()
    });
  } finally {
    isProcessing = false;
    requestQueue--;
    console.log(`🔄 Sistema liberado. Estado: disponible`);
  }
});

// Endpoint para formato de consola (similar al script original)
app.get('/consulta-consola/:placa', checkSimultaneousRequests, async (req, res) => {
  try {
    const { placa } = req.params;
    
    if (!placa) {
      isProcessing = false;
      requestQueue--;
      return res.status(400).send('Error: Placa requerida\n');
    }
    
    const placaLimpia = placa.trim().toUpperCase().replace(/\s+/g, '');
    const startTime = Date.now();
    
    console.log(`\n🚀 Iniciando consulta para placa: ${placaLimpia}`);
    console.log(`🔗 Usando proxy: ${PROXY_CONFIG.server}`);
    console.log(`🔍 Búsqueda activada para: SUBSIDIO, DONATIVO CRUZ ROJA, DONATIVO BOMBEROS`);
    
    const resultados = await runAutomation(placaLimpia);
    const tiempo = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Formatear respuesta como en la consola
    let respuesta = '';
    respuesta += '\n' + '='.repeat(60) + '\n';
    respuesta += `RESULTADOS COMPLETOS PARA PLACA: ${resultados.placa}\n`;
    respuesta += '='.repeat(60) + '\n';
    
    respuesta += '\n📋 INFORMACION DEL VEHICULO:\n';
    respuesta += '-'.repeat(40) + '\n';
    
    // Formatear la información del vehículo
    let currentKey = '';
    for (let i = 0; i < resultados.vehiculo.length; i++) {
      const item = resultados.vehiculo[i];
      if (item.endsWith(':')) {
        currentKey = item;
        respuesta += currentKey + '\n';
      } else if (currentKey && i > 0 && resultados.vehiculo[i - 1].endsWith(':')) {
        respuesta += item + '\n';
      } else {
        respuesta += item + '\n';
      }
    }
    
    respuesta += '\n💰 CARGOS:\n';
    respuesta += '-'.repeat(40) + '\n';
    if (resultados.cargos && resultados.cargos.length > 0) {
      if (resultados.cargos[0] === 'No se encontraron cargos') {
        respuesta += 'No se encontraron cargos\n';
      } else {
        resultados.cargos.forEach((cargo, index) => {
          respuesta += `${index + 1}. ${cargo}\n`;
        });
      }
    } else {
      respuesta += 'No se encontraron cargos\n';
    }
    
    respuesta += '\n🎯 SUBSIDIOS Y DONATIVOS:\n';
    respuesta += '-'.repeat(40) + '\n';
    
    // Mostrar subsidios y donativos
    const { subsidiosYdonativos } = resultados;
    
    if (subsidiosYdonativos.subsidioRefrendoProntoPago.encontrado) {
      respuesta += `✓ SUBSIDIO REFRENDO PRONTO PAGO: ${subsidiosYdonativos.subsidioRefrendoProntoPago.valor}\n`;
    } else {
      respuesta += `✗ SUBSIDIO REFRENDO PRONTO PAGO: No encontrado\n`;
    }
    
    if (subsidiosYdonativos.donativoCruzRoja.encontrado) {
      respuesta += `✓ DONATIVO CRUZ ROJA: ${subsidiosYdonativos.donativoCruzRoja.valor}\n`;
    } else {
      respuesta += `✗ DONATIVO CRUZ ROJA: No encontrado\n`;
    }
    
    if (subsidiosYdonativos.donativoBomberos.encontrado) {
      respuesta += `✓ DONATIVO BOMBEROS: ${subsidiosYdonativos.donativoBomberos.valor}\n`;
    } else {
      respuesta += `✗ DONATIVO BOMBEROS: No encontrado\n`;
    }
    
    respuesta += '\n📊 RESUMEN FINANCIERO:\n';
    respuesta += '-'.repeat(40) + '\n';
    respuesta += `SUBTOTAL: ${resultados.subtotal}\n`;
    respuesta += `TOTAL A PAGAR: ${resultados.totalAPagar}\n`;
    
    respuesta += '\n📈 DESGLOSE:\n';
    respuesta += '-'.repeat(40) + '\n';
    respuesta += `• Subsidio Refrendo: ${resultados.resumenFinanciero.desglose.subsidioRefrendo}\n`;
    respuesta += `• Donativo Cruz Roja: ${resultados.resumenFinanciero.desglose.donativoCruzRoja}\n`;
    respuesta += `• Donativo Bomberos: ${resultados.resumenFinanciero.desglose.donativoBomberos}\n`;
    
    respuesta += `\n⏱️ Tiempo de consulta: ${tiempo} segundos\n`;
    respuesta += `📅 Consultado el: ${new Date().toLocaleString()}\n`;
    
    res.set('Content-Type', 'text/plain');
    res.send(respuesta);
    
  } catch (error) {
    console.error('Error en la consulta:', error);
    res.status(500).send(`Error en la consulta. Verifique:\n1. Conexión a internet\n2. Proxy disponible\n3. Placa correcta\nDetalle del error: ${error.message}\n`);
  } finally {
    isProcessing = false;
    requestQueue--;
    console.log(`🔄 Sistema liberado. Estado: disponible`);
  }
});

// Endpoint para formato HTML
app.get('/consulta-html/:placa', checkSimultaneousRequests, async (req, res) => {
  try {
    const { placa } = req.params;
    
    if (!placa) {
      isProcessing = false;
      requestQueue--;
      return res.status(400).send('<h1>Error: Placa requerida</h1>');
    }
    
    const placaLimpia = placa.trim().toUpperCase().replace(/\s+/g, '');
    const resultados = await runAutomation(placaLimpia);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Consulta Vehicular - ${resultados.placa}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: #f5f5f5;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px; 
            border-radius: 8px;
            margin-bottom: 25px;
          }
          .section { 
            margin: 25px 0; 
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
          }
          .section-title { 
            background: #f8f9fa; 
            padding: 15px;
            font-weight: bold; 
            color: #333;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .section-content { 
            padding: 20px; 
          }
          .item { 
            margin: 10px 0; 
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .item:last-child {
            border-bottom: none;
          }
          .found { color: #28a745; }
          .not-found { color: #dc3545; }
          .highlight { 
            background: #fff3cd; 
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
            margin: 15px 0;
          }
          .money { 
            font-weight: bold; 
            color: #28a745;
            font-family: 'Courier New', monospace;
          }
          .subsidio { color: #17a2b8; }
          .donativo { color: #6f42c1; }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
          }
          .badge-found { background: #d4edda; color: #155724; }
          .badge-notfound { background: #f8d7da; color: #721c24; }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Consulta Vehicular</h1>
            <p>Placa: <strong>${resultados.placa}</strong></p>
            <p>Consultado el: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="section">
            <div class="section-title">📋 Información del Vehículo</div>
            <div class="section-content">
              ${resultados.vehiculo.map(item => `<div class="item">${item}</div>`).join('')}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">💰 Cargos</div>
            <div class="section-content">
              ${resultados.cargos.map((cargo, index) => `<div class="item">${index + 1}. ${cargo}</div>`).join('')}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">🎯 Subsidios y Donativos</div>
            <div class="section-content">
              <div class="item">
                <strong class="subsidio">SUBSIDIO REFRENDO PRONTO PAGO:</strong> 
                ${resultados.subsidiosYdonativos.subsidioRefrendoProntoPago.encontrado ? 
                  `<span class="money">${resultados.subsidiosYdonativos.subsidioRefrendoProntoPago.valor}</span>` : 
                  `<span class="not-found">No encontrado</span>`}
                <span class="badge ${resultados.subsidiosYdonativos.subsidioRefrendoProntoPago.encontrado ? 'badge-found' : 'badge-notfound'}">
                  ${resultados.subsidiosYdonativos.subsidioRefrendoProntoPago.encontrado ? 'ENCONTRADO' : 'NO ENCONTRADO'}
                </span>
              </div>
              
              <div class="item">
                <strong class="donativo">DONATIVO CRUZ ROJA:</strong> 
                ${resultados.subsidiosYdonativos.donativoCruzRoja.encontrado ? 
                  `<span class="money">${resultados.subsidiosYdonativos.donativoCruzRoja.valor}</span>` : 
                  `<span class="not-found">No encontrado</span>`}
                <span class="badge ${resultados.subsidiosYdonativos.donativoCruzRoja.encontrado ? 'badge-found' : 'badge-notfound'}">
                  ${resultados.subsidiosYdonativos.donativoCruzRoja.encontrado ? 'ENCONTRADO' : 'NO ENCONTRADO'}
                </span>
              </div>
              
              <div class="item">
                <strong class="donativo">DONATIVO BOMBEROS:</strong> 
                ${resultados.subsidiosYdonativos.donativoBomberos.encontrado ? 
                  `<span class="money">${resultados.subsidiosYdonativos.donativoBomberos.valor}</span>` : 
                  `<span class="not-found">No encontrado</span>`}
                <span class="badge ${resultados.subsidiosYdonativos.donativoBomberos.encontrado ? 'badge-found' : 'badge-notfound'}">
                  ${resultados.subsidiosYdonativos.donativoBomberos.encontrado ? 'ENCONTRADO' : 'NO ENCONTRADO'}
                </span>
              </div>
            </div>
          </div>
          
          <div class="highlight">
            <h3>📊 Resumen Financiero</h3>
            <div class="item"><strong>SUBTOTAL:</strong> <span class="money">${resultados.subtotal}</span></div>
            <div class="item"><strong>TOTAL A PAGAR:</strong> <span class="money">${resultados.totalAPagar}</span></div>
          </div>
          
          <div class="footer">
            <p>Consulta realizada con API Automatizada v3.0</p>
            <p>Proxy: ${PROXY_CONFIG.server}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    res.set('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    res.status(500).send('<h1>Error en la consulta</h1><p>Verifique la placa e intente nuevamente.</p>');
  } finally {
    isProcessing = false;
    requestQueue--;
  }
});

app.listen(port, () => {
  console.log(`🚀 API de consulta vehicular INICIADA - Versión Completa 3.0`);
  console.log(`📡 Puerto: ${port}`);
  console.log(`🌐 Proxy: ${PROXY_CONFIG.server}`);
  console.log(`📧 Email: ${EMAIL}`);
  console.log(`🔍 Búsqueda activada para:`);
  console.log(`   • SUBSIDIO REFRENDO PRONTO PAGO`);
  console.log(`   • DONATIVOS PARA CRUZ ROJA`);
  console.log(`   • DONATIVOS PARA PAT. DE BOMBEROS`);
  console.log(`✅ Sistema listo para extraer todos los datos`);
});
