// =====================================================================
// extras.js — telas funcionais (Transporte, Cartões, Ajuda) + mapa melhorado
// Carregado DEPOIS do script.js. Usa DADOS_MOCK e LOCAIS_REGIAO.
// =====================================================================
const $ = (id) => document.getElementById(id);
const BRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const D = DADOS_MOCK;
const NI = '<span class="nao-info">não informado (fonte oficial pendente)</span>';
const SELO = `<div class="selo-demo">${esc(D.avisoDemonstracao)}</div>`;

let cenario = 'normal';
let numeroDigitado = '';

// Estado da demonstração (saldo e extrato mudam com as recargas; fica salvo no navegador)
const CHAVE_ESTADO = 'totem-demo-cartao';
const estadoCartao = (() => {
  try { const s = JSON.parse(localStorage.getItem(CHAVE_ESTADO)); if (s && typeof s.saldo === 'number' && Array.isArray(s.extrato)) return s; } catch (e) {}
  return { saldo: D.cartao.saldo, extrato: D.extrato.map(m => ({ ...m })) };
})();
const salvarEstado = () => { try { localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estadoCartao)); } catch (e) {} };
function restaurarDemo() { estadoCartao.saldo = D.cartao.saldo; estadoCartao.extrato = D.extrato.map(m => ({ ...m })); salvarEstado(); }

// Leitura NFC (Web NFC: Chrome no Android, em https). Cartões de transporte comuns podem não ser lidos pelo navegador.
let nfcCtrl = null, nfcMsg = '';
const nfcSuportado = () => 'NDEFReader' in window;
async function lerNFC(aoLer, aoMsg) {
  if (!nfcSuportado()) return aoMsg('Este navegador/dispositivo não oferece leitura NFC ao site (requer Chrome no Android, em https). Digite o número ou use a simulação.');
  try {
    nfcCtrl?.abort(); nfcCtrl = new AbortController();
    const leitor = new NDEFReader();
    await leitor.scan({ signal: nfcCtrl.signal });
    aoMsg('📡 Aproxime o cartão do leitor...');
    leitor.onreading = (ev) => { nfcCtrl.abort(); aoLer(ev.serialNumber); };
    leitor.onreadingerror = () => aoMsg('Não foi possível ler o cartão. Aproxime novamente.');
  } catch (err) { aoMsg(err.name === 'NotAllowedError' ? 'Permissão de NFC negada.' : 'Não foi possível iniciar o NFC neste dispositivo.'); }
}

// ---------- Componentes ----------
function painelEstado(chave, voltarFn) {
  const e = D.estados[chave];
  return `<div class="estado ${e.tipo === 'erro' ? 'erro' : ''}" role="alert">
    <div class="ic" aria-hidden="true">${e.icone}</div>
    <div><h3>${e.titulo}</h3><p>${e.mensagem}</p>
    ${e.permiteRepetir ? `<p style="margin-top:12px"><button class="btn-grande" data-acao="repetir">Tentar novamente</button></p>` : ''}</div></div>`;
}

function simulador() {
  return `<div class="sim"><span>Simulador (demonstração):</span>${D.cenarios.map(c =>
    `<button class="chip ${c.id === cenario ? 'ativo' : ''}" data-cenario="${c.id}">${c.rotulo}</button>`).join('')}<button class="chip" data-acao="resetdemo">Restaurar saldo de demonstração</button></div>`;
}

// Fluxo: digitar número → validar → renderizar conteúdo
function telaIdentificar(el, titulo, aoValidar) {
  numeroDigitado = '';
  const desenhar = (msgEstado) => {
    el.innerHTML = `<div class="painel">${SELO}<h2>${titulo}</h2>
      <button class="btn-grande" data-acao="nfc">📡 Aproximar o cartão (NFC)</button>
      <p class="nota" aria-live="polite">${esc(nfcMsg) || 'Aproxime o cartão do leitor ou digite o número abaixo. Demonstração: qualquer cartão lido é tratado como o cartão de exemplo.'}</p>
      <button class="chip" data-acao="nfc-sim">Simular aproximação (demonstração)</button>
      <p class="texto-info">Ou digite o número do cartão. ${esc(D.dicaNumeroCartao)}</p>
      <div class="visor" aria-live="polite">${esc(numeroDigitado) || '—'}</div>
      <div class="teclado">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
        <button class="aux" data-k="C">Limpar</button><button data-k="0">0</button><button class="aux" data-k="B">Apagar</button></div>
      <button class="btn-grande" data-acao="confirmar">Continuar</button>
      ${msgEstado ? painelEstado(msgEstado) : ''}${simulador()}</div>`;
  };
  desenhar();
  el.onclick = (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cenario) { cenario = b.dataset.cenario; return desenhar(); }
    if (b.dataset.k) {
      const k = b.dataset.k;
      numeroDigitado = k === 'C' ? '' : k === 'B' ? numeroDigitado.slice(0, -1) : (numeroDigitado + k).slice(0, 12);
      el.querySelector('.visor').textContent = numeroDigitado || '—'; return;
    }
    if (b.dataset.acao === 'repetir') { numeroDigitado = ''; return desenhar(); }
    if (b.dataset.acao === 'resetdemo') { restaurarDemo(); nfcMsg = 'Saldo e extrato de demonstração restaurados.'; return desenhar(); }
    const aposLeitura = () => {
      if (cenario === 'bloqueado') return desenhar('bloqueado');
      if (cenario === 'nao-identificado') return desenhar('nao-identificado');
      numeroDigitado = D.cartao.numero; el.onclick = null; aoValidar();
    };
    if (b.dataset.acao === 'nfc-sim') { nfcMsg = ''; return aposLeitura(); }
    if (b.dataset.acao === 'nfc') { nfcMsg = ''; return lerNFC(aposLeitura, (m) => { nfcMsg = m; desenhar(); }); }
    if (b.dataset.acao === 'confirmar') {
      if (cenario === 'bloqueado') return desenhar('bloqueado');
      if (cenario === 'nao-identificado' || numeroDigitado !== D.cartao.numero) return desenhar('nao-identificado');
      el.onclick = null; aoValidar();
    }
  };
}

const rotuloCartao = () => `<div class="cartao-visual"><small>${esc(D.cartao.nome)} • ${esc(D.cartao.tipo)}</small>
  <strong>${esc(D.cartao.titular)}</strong><small>Nº ${esc(D.cartao.numero)} • Situação: ${esc(D.cartao.status)}</small></div>`;

// ---------- Telas ----------
const MONTAR = {
  'tela-saldo'(el) {
    telaIdentificar(el, 'Consultar saldo', () => {
      const passes = Math.floor(estadoCartao.saldo / D.valorPasse);
      el.innerHTML = `<div class="painel">${SELO}<h2>Consultar saldo</h2>
        <div class="cartao-visual"><small>${esc(D.cartao.nome)} • ${esc(D.cartao.tipo)}</small>
        <strong>${esc(D.cartao.titular)}</strong><small>Nº ${esc(D.cartao.numero)} • ${esc(D.cartao.status)}</small>
        <span class="saldo">${BRL(estadoCartao.saldo)}</span>
        <small>≈ ${passes} passes de ${BRL(D.valorPasse)} (tarifa urbana de Londrina)</small></div>
        <p class="nota">${esc(D.avisoDemonstracao)}. Valores, titular e datas são fictícios.</p></div>`;
    });
  },
  'tela-extrato'(el) {
    telaIdentificar(el, 'Consultar extrato', () => {
      const ent = estadoCartao.extrato.filter(m => m.valor > 0).reduce((s, m) => s + m.valor, 0);
      const sai = estadoCartao.extrato.filter(m => m.valor < 0).reduce((s, m) => s + m.valor, 0);
      el.innerHTML = `<div class="painel">${SELO}<h2>Extrato</h2>${rotuloCartao()}
        ${estadoCartao.extrato.map(m => `<div class="linha-mov"><div><b>${m.tipo === 'recarga' ? '⬆ ' + esc(m.descricao) : '⬇ ' + esc(m.onibus)}</b>
          <small>${m.tipo === 'recarga' ? 'Recarga' : 'Utilização'} • ${esc(m.rotuloData)}</small></div>
          <span class="${m.valor > 0 ? 'pos' : 'neg'}">${m.valor > 0 ? '+' : '−'} ${BRL(Math.abs(m.valor))}</span></div>`).join('')}
        <div class="linha-mov"><b>Entradas / Saídas no período</b><span><span class="pos">${BRL(ent)}</span> / <span class="neg">${BRL(Math.abs(sai))}</span></span></div>
        <p class="nota">${esc(D.avisoDemonstracao)}.</p></div>`;
    });
  },
  'tela-recarga'(el) {
    telaIdentificar(el, 'Recarregar cartão', () => {
      let qtd = D.quantidadesPasses[2], forma = D.formasPagamento[0].id;
      const desenhar = () => {
        const total = qtd * D.valorPasse;
        el.innerHTML = `<div class="painel">${SELO}<h2>Recarregar cartão</h2>${rotuloCartao()}
          <div class="linha-mov"><b>Saldo atual</b><span class="pos">${BRL(estadoCartao.saldo)}</span></div>
          <h3>Quantos passes?</h3><div class="chips">${D.quantidadesPasses.map(q => `<button class="chip ${q === qtd ? 'ativo' : ''}" data-q="${q}">${q}</button>`).join('')}</div>
          <h3>Forma de pagamento</h3><div class="chips">${D.formasPagamento.map(f => `<button class="chip ${f.id === forma ? 'ativo' : ''}" data-f="${f.id}">${f.rotulo}</button>`).join('')}</div>
          <div class="linha-mov"><b>Total (${qtd} × ${BRL(D.valorPasse)})</b><span class="pos">${BRL(total)}</span></div>
          <button class="btn-grande" data-acao="pagar">Confirmar (simulação)</button>
          <p class="nota">${esc(D.avisoSimulacao)}</p></div>`;
      };
      desenhar();
      el.onclick = (ev) => {
        const b = ev.target.closest('button'); if (!b) return;
        if (b.dataset.q) { qtd = +b.dataset.q; desenhar(); }
        else if (b.dataset.f) { forma = b.dataset.f; desenhar(); }
        else if (b.dataset.acao === 'pagar') {
          const nome = D.formasPagamento.find(f => f.id === forma).rotulo, total = qtd * D.valorPasse;
          estadoCartao.saldo = Math.round((estadoCartao.saldo + total) * 100) / 100;
          estadoCartao.extrato.unshift({ tipo: 'recarga', descricao: `Recarga de ${qtd} passes`, rotuloData: new Date().toLocaleDateString('pt-BR'), valor: total });
          salvarEstado();
          el.innerHTML = `<div class="painel">${SELO}<div class="estado"><div class="ic">✓</div><div><h3>Simulação concluída</h3>
            <p>Recarga de ${qtd} passes (${BRL(total)}) via ${esc(nome)}. O valor foi adicionado ao saldo de demonstração. Novo saldo: <b>${BRL(estadoCartao.saldo)}</b>.</p></div></div>
            <p class="nota">${esc(D.avisoSimulacao)}</p></div>`;
          el.onclick = null;
        }
      };
    });
  },
  'tela-bloqueio'(el) {
    telaIdentificar(el, 'Bloquear / Cancelar cartão', () => {
      el.innerHTML = `<div class="painel">${SELO}<h2>Bloquear / Cancelar</h2>${rotuloCartao()}
        <p class="texto-info">Deseja solicitar o bloqueio deste cartão?</p>
        <div class="chips"><button class="btn-grande" data-acao="sim">Sim, bloquear (simulação)</button><button class="btn-grande sec" data-acao="nao">Não</button></div>
        <p class="nota">${esc(D.avisoSimulacaoBloqueio)} Para bloqueio real, procure o posto presencial do terminal central.</p></div>`;
      el.onclick = (ev) => {
        const a = ev.target.closest('button')?.dataset.acao;
        if (a === 'sim') { el.innerHTML = `<div class="painel">${SELO}${painelEstado('operacao-cancelada').replace('Operação cancelada', 'Solicitação simulada').replace(/A operação foi cancelada\.[^<]*/, esc(D.avisoSimulacaoBloqueio))}</div>`; el.onclick = null; }
        if (a === 'nao') { voltar(); }
      };
    });
  },
  'tela-carregamento'(el) {
    el.innerHTML = `<div class="painel">${SELO}<h2>Como carregar o cartão</h2>
      <ol class="passos"><li>Vá a um ponto de recarga credenciado nos terminais.</li>
      <li>Informe o valor ou a quantidade de passes e escolha a forma de pagamento.</li>
      <li>Aproxime o cartão do leitor até a confirmação.</li>
      <li>Valide a recarga nos ônibus ou nas catracas dos terminais antes de usar o saldo.</li></ol>
      <p class="nota">A recarga pelo totem (Pix e cartão) é uma etapa futura do projeto. Hoje a tela “Recarregar cartão” apenas simula o fluxo.</p></div>`;
  },
  'tela-tipos-cartao'(el) {
    el.innerHTML = `<div class="painel">${SELO}<h2>Tipos de cartão</h2><div class="lista-cards">
      <div class="card-info"><b>TCGL / Grande Londrina</b><span>Cartão do sistema urbano da região de Londrina.</span></div>
      <div class="card-info"><b>TIL Transportes (Metropolitano)</b><span>Cartão do sistema metropolitano.</span></div>
      <div class="card-info"><b>Cartão Estudante / Isento</b><span>Cartão com condição especial, conforme regras da operadora.</span></div>
      <div class="card-info"><b>${esc(D.cartao.tipo)} (exemplo)</b><span>Tipo usado na demonstração.</span></div></div>
      <p class="nota">Regras de uso, valores e documentos exigidos: ${NI}. Consulte o posto presencial.</p></div>`;
  },
  'tela-transporte'(el) { montarTransporte(el); },
  'tela-ajuda'(el) { montarAjuda(el); }
};

// delegação do simulador (cenários) também na tela inicial de cartões
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-cenario]'); if (c) cenario = c.dataset.cenario;
});

// ---------- Transporte ----------
// Informações verificadas em fontes públicas (Prefeitura de Londrina, Diário do Transporte, Bem Paraná)
const DETALHES_TERMINAIS = {
  444: 'Inaugurado em 1988, tem 2 pisos e 10 plataformas (3 no inferior e 7 no superior), com cerca de 50 pontos de embarque. É o principal fluxo de passageiros da cidade.',
  432: 'Reconstruído pela Prefeitura: área ampliada de 1.724,50 m² para 3.488,35 m², com piso tátil, rampas, sanitários acessíveis, fraldário e bicicletário.',
  436: 'Terminal reformado e entregue pela Prefeitura, no pacote de reforma de quatro terminais de Londrina.',
  452: 'Terminal reformado e entregue pela Prefeitura, no pacote de reforma de quatro terminais de Londrina.',
  440: 'Incluído no pacote de reforma de quatro terminais de Londrina (obras iniciadas em 2022).'
};
const INFO_SISTEMA = [
  ['💰 Tarifa urbana de Londrina', 'R$ 6,25 (reajuste de 2026; antes R$ 5,75).'],
  ['☎️ Atendimento ao cliente', '0800-400-7020, aplicativo MOV Londrina e postos de atendimento nos terminais de ônibus de Londrina.']
];
const OPERADORAS = [
  ['TCGL', 'Transportes Coletivos Grande Londrina. Atua em Londrina desde 1958 e opera linhas urbanas da cidade.'],
  ['Londrisul', 'Londrisul Transportes Coletivos. Opera linhas urbanas de Londrina junto com a TCGL.'],
  ['TIL', 'TIL Transportes Coletivos. Atua no transporte urbano de Ibiporã e Cambé e em linhas metropolitanas, segundo a imprensa regional.']
];
function montarTransporte(el) {
  const terminais = LOCAIS_REGIAO.filter(l => l.categoria === 'terminal');
  const cont = {};
  LOCAIS_REGIAO.forEach(l => (l.linhas || []).forEach(n => { (cont[n] = cont[n] || []).push(l); }));
  const nums = Object.keys(cont).sort((a, b) => a - b);
  let cidade = 'todas', busca = '';
  const desenhar = () => {
    const ts = terminais.filter(t => cidade === 'todas' || t.cidade === cidade);
    const ls = nums.filter(n => !busca || n.includes(busca));
    el.innerHTML = `<div class="painel">${SELO}<h2>Transporte público</h2>
      <div class="chips">${['todas', 'Londrina', 'Cambé', 'Ibiporã'].map(c => `<button class="chip ${c === cidade ? 'ativo' : ''}" data-c="${c}">${c === 'todas' ? 'Todas' : c}</button>`).join('')}</div>
      <h3>Terminais (${ts.length})</h3><div class="lista-cards">${ts.map(t => `<div class="card-info"><b>${esc(t.nome)}</b>
        <span>${esc(t.cidade)} • ${esc(t.status)}</span><span>📍 ${t.endereco ? esc(t.endereco) : NI}</span>
        ${DETALHES_TERMINAIS[t.id] ? `<span>ℹ️ ${esc(DETALHES_TERMINAIS[t.id])}</span>` : ''}
        <span>🕒 ${t.horario ? esc(t.horario) : NI}</span><span>📞 ${t.fone ? esc(t.fone) : NI}</span>
        <button data-mapa="${t.id}">Ver no mapa</button></div>`).join('')}</div>
      <h3>Sistema de transporte</h3><div class="lista-cards">${INFO_SISTEMA.map(([t, v]) => `<div class="card-info"><b>${t}</b><span>${esc(v)}</span></div>`).join('')}</div>
      <h3>Operadoras</h3><div class="lista-cards">${OPERADORAS.map(([t, v]) => `<div class="card-info"><b>🚌 ${t}</b><span>${esc(v)}</span></div>`).join('')}</div>
      <h3>Linhas que passam pelos pontos mapeados</h3>
      <input type="search" id="busca-linha" placeholder="Digite o número da linha (ex.: 217)" value="${esc(busca)}">
      <div class="chips">${ls.length ? ls.map(n => `<button class="chip ${busca === n ? 'ativo' : ''}" data-l="${n}">${n} <small>(${cont[n].length})</small></button>`).join('') : '<span class="nao-info">Nenhuma linha encontrada.</span>'}</div>
      ${cont[busca] ? `<div class="lista-cards">${cont[busca].map(p => `<div class="card-info"><b>${esc(p.nome)}</b><span>${esc(p.cidade)}</span><button data-mapa="${p.id}">Ver no mapa</button></div>`).join('')}</div>` : ''}
      <p class="nota">Tarifa, operadoras, atendimento e detalhes dos terminais vêm de fontes públicas (Prefeitura de Londrina e imprensa). Não encontrei uma operadora chamada “TCL”; a sigla do sistema de Londrina é TCGL. Cambé e Ibiporã ainda não têm dados oficiais confirmados. Horários e tempo de chegada em tempo real dependem de APIs oficiais (em integração).
      Os números de linha acima vêm das referências dos pontos no OpenStreetMap e não formam a lista oficial de linhas.</p></div>`;
    const inp = $('busca-linha');
    inp.oninput = () => { busca = inp.value.trim(); const p = inp.selectionStart; desenhar(); const n = $('busca-linha'); n.focus(); n.setSelectionRange(p, p); };
  };
  desenhar();
  el.onclick = (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.c) { cidade = b.dataset.c; desenhar(); }
    else if (b.dataset.l) { busca = busca === b.dataset.l ? '' : b.dataset.l; desenhar(); }
    else if (b.dataset.mapa) abrirLocalNoMapa(+b.dataset.mapa);
  };
}

// ---------- Ajuda e acessibilidade ----------
let btDispositivo = null, btMsg = '';
async function btConectar() {
  if (!navigator.bluetooth) { btMsg = 'Este navegador/dispositivo não oferece Bluetooth ao site. Use as configurações Bluetooth do sistema do totem.'; return; }
  try {
    btDispositivo = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['battery_service'] });
    btDispositivo.addEventListener('gattserverdisconnected', () => { btMsg = 'Dispositivo desconectado.'; const el = $('tela-ajuda'); if (telaAtual === 'tela-ajuda') montarAjuda(el); });
    await btDispositivo.gatt.connect();
    btMsg = `Conectado: ${btDispositivo.name || 'dispositivo sem nome'}.`;
  } catch (err) { btDispositivo = null; btMsg = err.name === 'NotFoundError' ? 'Nenhum dispositivo selecionado.' : 'Não foi possível conectar. Tente novamente.'; }
}
function btDesconectar() { if (btDispositivo?.gatt?.connected) btDispositivo.gatt.disconnect(); btDispositivo = null; btMsg = 'Dispositivo desconectado.'; }

function montarAjuda(el) {
  const grande = document.documentElement.classList.contains('texto-grande');
  const contraste = document.body.classList.contains('alto-contraste');
  el.innerHTML = `<div class="painel"><h2>Ajuda e acessibilidade</h2>
    <h3>Ajustes de tela</h3><div class="chips">
      <button class="chip ${grande ? 'ativo' : ''}" data-ac="texto">🔠 Letras maiores</button>
      <button class="chip ${contraste ? 'ativo' : ''}" data-ac="contraste">◐ Alto contraste</button>
      <button class="chip" data-ac="voz">🔊 Ler esta tela em voz alta</button></div>
    <h3>Bluetooth</h3><div class="chips">
      <button class="chip ${btDispositivo ? 'ativo' : ''}" data-ac="bt">🎧 ${btDispositivo ? 'Trocar dispositivo' : 'Conectar dispositivo Bluetooth'}</button>
      ${btDispositivo ? '<button class="chip" data-ac="bt-off">Desconectar</button>' : ''}
      <button class="chip" data-ac="bt-teste">🔊 Testar áudio</button></div>
    <p class="nota" aria-live="polite">${esc(btMsg) || 'Conecte um fone ou aparelho auditivo para ouvir as instruções do totem. Se o seu fone não aparecer na lista, faça o pareamento nas configurações Bluetooth do sistema do totem e use “Testar áudio”.'}</p>
    <h3>Perguntas frequentes</h3>
    <details><summary>Como consulto meu saldo?</summary><p>Em Cartões → Consultar saldo, digite o número do cartão. Na versão com leitor, bastará aproximar o cartão.</p></details>
    <details><summary>Posso recarregar aqui?</summary><p>Ainda não. A recarga por Pix e cartão é etapa futura; hoje use os pontos credenciados nos terminais.</p></details>
    <details><summary>Perdi meu cartão. O que faço?</summary><p>Procure o posto presencial do terminal central para bloquear ou cancelar.</p></details>
    <details><summary>Como chego a um terminal ou ponto?</summary><p>Em Mapas e Rotas, escolha o local e escaneie o QR Code para abrir o trajeto no celular.</p></details>
    <details><summary>Meus dados estão seguros?</summary><p>Esta é uma demonstração com dados fictícios. Nenhum dado pessoal é coletado.</p></details>
    <div class="area-reservada"><b>Atendimento presencial</b><p>Postos de atendimento nos terminais de ônibus. Serviço de Atendimento ao Cliente (Londrina): 0800-400-7020 e aplicativo MOV Londrina. Horário de atendimento: ${NI}.</p></div></div>`;
  el.onclick = (ev) => {
    const a = ev.target.closest('[data-ac]')?.dataset.ac; if (!a) return;
    if (a === 'bt') { btConectar().then(() => montarAjuda(el)); return; }
    if (a === 'bt-off') { btDesconectar(); return montarAjuda(el); }
    if (a === 'bt-teste') { if ('speechSynthesis' in window) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance('Teste de áudio do Smart Totem. Se você está ouvindo esta mensagem, o som está funcionando.'); u.lang = 'pt-BR'; speechSynthesis.speak(u); } return; }
    if (a === 'texto') document.documentElement.classList.toggle('texto-grande');
    if (a === 'contraste') document.body.classList.toggle('alto-contraste');
    if (a === 'voz' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(el.innerText.slice(0, 1500)); u.lang = 'pt-BR'; speechSynthesis.speak(u);
    }
    if (a !== 'voz') montarAjuda(el);
  };
}

// ---------- Navegação: monta a tela ao abrir ----------
const _mostrarTela = mostrarTela;
mostrarTela = function (id) {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  nfcCtrl?.abort(); nfcMsg = '';
  _mostrarTela(id);
  if (MONTAR[id]) MONTAR[id]($(id));
  reiniciarInatividade();
};

// Totem: volta ao início após 90 s sem toque
let _timerInativo;
function reiniciarInatividade() {
  clearTimeout(_timerInativo);
  if (telaAtual !== 'tela-inicial') _timerInativo = setTimeout(() => { cenario = 'normal'; mostrarTela('tela-inicial'); }, 90000);
}
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, reiniciarInatividade, { passive: true }));

// ---------- MAPA MELHORADO ----------
let rotaReal = null, nomeLocalSel = null, mostrarTodos = false;
const LIMITE_LISTA = 60;

const _inicializarMapa = inicializarMapa;
inicializarMapa = function () {
  _inicializarMapa();
  if (!mapaInstancia) return;
  if (typeof L.markerClusterGroup === 'function') {
    mapaInstancia.removeLayer(marcadoresGrupo);
    marcadoresGrupo = L.markerClusterGroup({ maxClusterRadius: 45, showCoverageOnHover: false, disableClusteringAtZoom: 17 }).addTo(mapaInstancia);
  }
  // Ruas e nomes de lugares sobre o satélite (Esri)
  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
  L.tileLayer(ESRI + 'Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, opacity: .85 }).addTo(mapaInstancia);
  L.tileLayer(ESRI + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }).addTo(mapaInstancia);
  const lista = $('lista-locais');
  const bp = document.createElement('button');
  bp.className = 'btn-proximo'; bp.textContent = '⭐ Terminal mais próximo de mim';
  bp.onclick = () => {
    const t = LOCAIS_REGIAO.filter(l => l.categoria === 'terminal')
      .map(l => ({ l, d: calcularDistanciaKm(usuarioCoordenadas[0], usuarioCoordenadas[1], l.lat, l.lng) }))
      .sort((a, b) => a.d - b.d)[0];
    selecionarEExibirLocal(t.l, t.d);
  };
  lista.parentNode.insertBefore(bp, lista);
  atualizarMapaELista();
};

function textoBusca(l) {
  return [l.nome, l.endereco, l.cidade, l.status, (l.linhas || []).join(' ')].join(' ').toLowerCase();
}

atualizarMapaELista = function () {
  if (!marcadoresGrupo) return;
  marcadoresGrupo.clearLayers();
  const cont = $('lista-locais'); cont.innerHTML = '';
  const termo = ($('busca-local')?.value || '').trim().toLowerCase();
  const cidade = document.querySelector('.btn-cidade.ativo')?.dataset.cidade || 'todas';
  const cat = document.querySelector('.btn-filtro.ativo')?.dataset.categoria || 'tudo';
  atualizarContadoresCategorias(cidade, termo);

  const filtrados = LOCAIS_REGIAO
    .filter(l => (cidade === 'todas' || l.cidade === cidade) && (cat === 'tudo' || l.categoria === cat) && textoBusca(l).includes(termo))
    .map(l => ({ l, d: calcularDistanciaKm(usuarioCoordenadas[0], usuarioCoordenadas[1], l.lat, l.lng) }))
    .sort((a, b) => a.d - b.d);

  if (!filtrados.length) { cont.innerHTML = '<div class="sem-resultados">Nenhum ponto encontrado para os filtros selecionados.</div>'; return; }

  filtrados.forEach(({ l, d }, i) => {
    const term = l.categoria === 'terminal';
    const m = L.marker([l.lat, l.lng], {
      icon: L.divIcon({ className: '', html: `<div class="custom-pin ${term ? 'terminal' : 'transporte'}"><span>${term ? '🏢' : '🚏'}</span></div>`, iconSize: [40, 40], iconAnchor: [20, 40] }),
      title: l.nome
    });
    m.bindPopup(`<strong style="color:#ffc629">${esc(l.nome)}</strong><br><span style="font-size:12px;color:#ccc">${esc(l.cidade)} • ${d} km</span>`);
    m.on('click', () => selecionarEExibirLocal(l, d));
    marcadoresGrupo.addLayer(m);

    if (!mostrarTodos && i >= LIMITE_LISTA) return;
    const card = document.createElement('div');
    card.className = 'item-local ' + (term ? 'terminal' : 'transporte');
    card.innerHTML = `<div class="item-header-linha"><span class="item-titulo">${term ? '🏢 ' : '🚏 '}${esc(l.nome)}</span><span class="item-distancia">${d} km</span></div>
      <div class="item-sub">${esc(l.cidade)} • ${esc(l.status)}${l.endereco ? ' • ' + esc(l.endereco) : ''}</div>
      ${l.linhas ? `<div class="chips-linha">${l.linhas.map(n => `<i>${n}</i>`).join('')}</div>` : ''}`;
    card.onclick = () => { selecionarEExibirLocal(l, d); m.openPopup?.(); };
    cont.appendChild(card);
  });
  if (!mostrarTodos && filtrados.length > LIMITE_LISTA) {
    const mais = document.createElement('button');
    mais.className = 'btn-mais'; mais.textContent = `Mostrar todos (${filtrados.length})`;
    mais.onclick = () => { mostrarTodos = true; atualizarMapaELista(); };
    cont.appendChild(mais);
  }
};

// Rota a pé real (OSRM); se falhar, usa linha reta
desenharLinhaRota = function (origem, destino) {
  limparLinhaRota();
  const reta = () => { rotaLinha = L.polyline([origem, destino], { color: '#ffc629', weight: 5, opacity: .9, dashArray: '10, 10', className: 'linha-rota-animada' }).addTo(mapaInstancia); };
  const alvo = nomeLocalSel;
  fetch(`https://router.project-osrm.org/route/v1/foot/${origem[1]},${origem[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`)
    .then(r => r.json())
    .then(j => {
      if (alvo !== nomeLocalSel) return;
      const r = j.routes && j.routes[0]; if (!r) return reta();
      rotaLinha = L.geoJSON(r.geometry, { style: { color: '#ffc629', weight: 6, opacity: .95 } }).addTo(mapaInstancia);
      mapaInstancia.fitBounds(rotaLinha.getBounds(), { padding: [60, 60], maxZoom: 16 });
      const km = (r.distance / 1000).toFixed(1), min = Math.max(1, Math.round(r.duration / 60));
      $('detalhe-distancia').innerText = `📏 ${km} km (a pé)`;
      $('detalhe-tempo-pe').innerText = `${min} min`;
    })
    .catch(reta);
  reta();
};

const _selecionar = selecionarEExibirLocal;
selecionarEExibirLocal = function (local, dist) { nomeLocalSel = local.id; _selecionar(local, dist); };

exibirDetalhes = function (l, dist) {
  $('detalhe-nome').innerText = l.nome;
  $('detalhe-badge').innerText = `${l.cidade} • ${l.status}`;
  $('detalhe-distancia').innerText = `📏 ${dist} km (em linha reta)`;
  $('detalhe-endereco').innerHTML = `📍 ${l.endereco ? esc(l.endereco) : NI}`;
  $('detalhe-horario').innerHTML = `🕒 ${l.horario ? esc(l.horario) : NI}`;
  $('detalhe-fone').innerHTML = `📞 ${l.fone ? esc(l.fone) : NI}` + (l.linhas ? `<span class="chips-linha">Linhas: ${l.linhas.map(n => `<i>${n}</i>`).join('')}</span>` : '');
  $('detalhe-tempo-pe').innerText = `${Math.max(1, Math.round(dist / 5 * 60))} min`;
  // estimativa grosseira: não há dados reais de tempo de chegada sem API oficial
  $('detalhe-tempo-bus').innerText = `~${Math.max(3, Math.round(dist / 20 * 60 + 5))} min (estimado)`;
  const url = `https://www.google.com/maps/dir/?api=1&origin=${usuarioCoordenadas[0]},${usuarioCoordenadas[1]}&destination=${l.lat},${l.lng}&travelmode=transit`;
  $('detalhe-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(url)}`;
  $('mapa-detalhes').classList.remove('oculta');
};

// Abre o mapa já focado em um local (usado pela tela Transporte)
function abrirLocalNoMapa(id) {
  const l = LOCAIS_REGIAO.find(x => x.id === id); if (!l) return;
  mostrarTela('tela-mapas');
  setTimeout(() => {
    const dist = calcularDistanciaKm(usuarioCoordenadas[0], usuarioCoordenadas[1], l.lat, l.lng);
    selecionarEExibirLocal(l, dist);
  }, 700);
}

// Ao abrir "Mapas e Rotas" a lista sempre reaparece reduzida
const _mt2 = mostrarTela;
mostrarTela = function (id) { if (id === 'tela-mapas') mostrarTodos = false; _mt2(id); };
