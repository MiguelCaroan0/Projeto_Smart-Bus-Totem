// ===== 1. Estado Global =====
const telas = document.querySelectorAll('.tela');
const barraNav = document.getElementById('barra-nav');
const botaoVoltar = document.getElementById('botao-voltar');
const botaoCancelar = document.getElementById('botao-cancelar');
const confirmacao = document.getElementById('confirmacao');
const botaoSim = document.getElementById('botao-sim');
const botaoNao = document.getElementById('botao-nao');
const telaInicial = document.getElementById('tela-inicial');

let mapaInstancia = null;
let marcadoresGrupo = null;
let marcadorUsuario = null;
let rotaLinha = null;
let camadaTileAtual = null;

// Centro de Londrina (Ponto Padrão)
const CENTRO_LONDRINA = [-23.3106, -51.1628];
let usuarioCoordenadas = [...CENTRO_LONDRINA];

// Bounding Box Estrita (Londrina, Cambé e Ibiporã)
const LIMITES_REGIAO = [
  [-23.4200, -51.3200], // Sudoeste
  [-23.1800, -50.9800]  // Nordeste
];

// Configuração de Camadas
const TILE_LAYERS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  claro: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  satelite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

function estaDentroDosLimites(lat, lng) {
  const [sw, ne] = LIMITES_REGIAO;
  return lat >= sw[0] && lat <= ne[0] && lng >= sw[1] && lng <= ne[1];
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return parseFloat((R * c).toFixed(1));
}

// ===== 2. Base de Dados COMPLETA de Pontos de Ônibus =====
// Fonte: OpenStreetMap (Overpass API) + terminais oficiais
// 456 pontos de Londrina, Cambé e Ibiporã — dados estáticos (zero erro de rede)
// Pontos de ônibus - Londrina, Cambé e Ibiporã
// Fonte: OpenStreetMap (Overpass) + terminais oficiais
// Gerado automaticamente - dados estáticos para precisão e zero erros de rede

const LOCAIS_REGIAO = [
  {"id":1,"nome":"Parada Cambé nº 1","cidade":"Cambé","categoria":"transporte","lat":-23.315737,"lng":-51.285686,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":2,"nome":"Parada Cambé nº 2","cidade":"Cambé","categoria":"transporte","lat":-23.289761,"lng":-51.243804,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":3,"nome":"Parada Cambé nº 3","cidade":"Cambé","categoria":"transporte","lat":-23.290708,"lng":-51.245528,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":4,"nome":"Parada Cambé nº 4","cidade":"Cambé","categoria":"transporte","lat":-23.290772,"lng":-51.246145,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":5,"nome":"Terminal Municipal de Cambé","cidade":"Cambé","categoria":"terminal","lat":-23.276848,"lng":-51.279932,"endereco":"Rua Belo Horizonte","horario":null,"fone":null,"status":"Terminal de integração"},
  {"id":6,"nome":"Terminal Rodoviário Wladeck","cidade":"Cambé","categoria":"terminal","lat":-23.290499,"lng":-51.278668,"endereco":null,"horario":null,"fone":null,"status":"Rodoviária / intermunicipal"},
  {"id":8,"nome":"Parada Londrina/Ibiporã","cidade":"Ibiporã","categoria":"transporte","lat":-23.307887,"lng":-51.159586,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":9,"nome":"Parada Ibiporã nº 1","cidade":"Ibiporã","categoria":"transporte","lat":-23.281052,"lng":-51.068916,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":10,"nome":"Parada Ibiporã nº 2","cidade":"Ibiporã","categoria":"transporte","lat":-23.275143,"lng":-51.060122,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":11,"nome":"Parada Ibiporã nº 3","cidade":"Ibiporã","categoria":"transporte","lat":-23.274452,"lng":-51.057915,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":12,"nome":"Parada Ibiporã nº 4","cidade":"Ibiporã","categoria":"transporte","lat":-23.27372,"lng":-51.056929,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":13,"nome":"Parada Ibiporã nº 5","cidade":"Ibiporã","categoria":"transporte","lat":-23.271561,"lng":-51.052242,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":14,"nome":"Parada Ibiporã nº 6","cidade":"Ibiporã","categoria":"transporte","lat":-23.270458,"lng":-51.05033,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":15,"nome":"Parada Ibiporã nº 7","cidade":"Ibiporã","categoria":"transporte","lat":-23.271742,"lng":-51.052947,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":16,"nome":"Parada Ibiporã nº 8","cidade":"Ibiporã","categoria":"transporte","lat":-23.270465,"lng":-51.050047,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":17,"nome":"Parada Ibiporã nº 9","cidade":"Ibiporã","categoria":"transporte","lat":-23.269028,"lng":-51.046841,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":18,"nome":"Parada Ibiporã nº 10","cidade":"Ibiporã","categoria":"transporte","lat":-23.260736,"lng":-50.998515,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":19,"nome":"Parada Ibiporã nº 11","cidade":"Ibiporã","categoria":"transporte","lat":-23.269194,"lng":-51.04665,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":20,"nome":"Parada Ibiporã nº 12","cidade":"Ibiporã","categoria":"transporte","lat":-23.267874,"lng":-51.048606,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":21,"nome":"Parada Ibiporã nº 13","cidade":"Ibiporã","categoria":"transporte","lat":-23.259804,"lng":-51.062889,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":22,"nome":"Parada Ibiporã nº 14","cidade":"Ibiporã","categoria":"transporte","lat":-23.289069,"lng":-51.082209,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":23,"nome":"Parada Ibiporã nº 15","cidade":"Ibiporã","categoria":"transporte","lat":-23.288092,"lng":-51.018043,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":24,"nome":"Parada Ibiporã nº 16","cidade":"Ibiporã","categoria":"transporte","lat":-23.287573,"lng":-51.016613,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":25,"nome":"Parada Ibiporã nº 17","cidade":"Ibiporã","categoria":"transporte","lat":-23.286663,"lng":-51.015988,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":26,"nome":"Parada Ibiporã nº 18","cidade":"Ibiporã","categoria":"transporte","lat":-23.286514,"lng":-51.018086,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":27,"nome":"Parada Ibiporã nº 19","cidade":"Ibiporã","categoria":"transporte","lat":-23.286611,"lng":-51.020283,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":28,"nome":"Parada Ibiporã nº 20","cidade":"Ibiporã","categoria":"transporte","lat":-23.287088,"lng":-51.020071,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":29,"nome":"Parada Ibiporã nº 21","cidade":"Ibiporã","categoria":"transporte","lat":-23.286289,"lng":-51.020745,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":30,"nome":"Parada Ibiporã nº 22","cidade":"Ibiporã","categoria":"transporte","lat":-23.285993,"lng":-51.022204,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":31,"nome":"Parada Ibiporã nº 23","cidade":"Ibiporã","categoria":"transporte","lat":-23.285686,"lng":-51.023716,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":32,"nome":"Parada Ibiporã nº 24","cidade":"Ibiporã","categoria":"transporte","lat":-23.284453,"lng":-51.024171,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":33,"nome":"Parada Ibiporã nº 25","cidade":"Ibiporã","categoria":"transporte","lat":-23.283326,"lng":-51.024661,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":34,"nome":"Parada Ibiporã nº 26","cidade":"Ibiporã","categoria":"transporte","lat":-23.282071,"lng":-51.024649,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":35,"nome":"Parada Ibiporã nº 27","cidade":"Ibiporã","categoria":"transporte","lat":-23.279333,"lng":-51.024863,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":36,"nome":"Parada Ibiporã nº 28","cidade":"Ibiporã","categoria":"transporte","lat":-23.279333,"lng":-51.024598,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":37,"nome":"Parada Ibiporã nº 29","cidade":"Ibiporã","categoria":"transporte","lat":-23.28079,"lng":-51.022411,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":38,"nome":"Parada Ibiporã nº 30","cidade":"Ibiporã","categoria":"transporte","lat":-23.280888,"lng":-51.022479,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":39,"nome":"Parada Ibiporã nº 31","cidade":"Ibiporã","categoria":"transporte","lat":-23.282495,"lng":-51.016997,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":40,"nome":"Parada Ibiporã nº 32","cidade":"Ibiporã","categoria":"transporte","lat":-23.281504,"lng":-51.015172,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":41,"nome":"Parada Ibiporã nº 33","cidade":"Ibiporã","categoria":"transporte","lat":-23.28026,"lng":-51.015574,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":42,"nome":"Parada Ibiporã nº 34","cidade":"Ibiporã","categoria":"transporte","lat":-23.278856,"lng":-51.016017,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":43,"nome":"Parada Ibiporã nº 35","cidade":"Ibiporã","categoria":"transporte","lat":-23.279063,"lng":-51.017157,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":44,"nome":"Parada Ibiporã nº 36","cidade":"Ibiporã","categoria":"transporte","lat":-23.280058,"lng":-51.017549,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":45,"nome":"Parada Ibiporã nº 37","cidade":"Ibiporã","categoria":"transporte","lat":-23.282831,"lng":-51.01866,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":46,"nome":"Parada Ibiporã nº 38","cidade":"Ibiporã","categoria":"transporte","lat":-23.258528,"lng":-51.059394,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":47,"nome":"Parada Ibiporã nº 39","cidade":"Ibiporã","categoria":"transporte","lat":-23.257441,"lng":-51.059517,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":48,"nome":"Parada Ibiporã nº 40","cidade":"Ibiporã","categoria":"transporte","lat":-23.26564,"lng":-51.0496,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":49,"nome":"Parada Ibiporã nº 41","cidade":"Ibiporã","categoria":"transporte","lat":-23.266046,"lng":-51.049989,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":50,"nome":"Parada Ibiporã nº 42","cidade":"Ibiporã","categoria":"transporte","lat":-23.265243,"lng":-51.044824,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":51,"nome":"Parada Ibiporã nº 43","cidade":"Ibiporã","categoria":"transporte","lat":-23.264764,"lng":-51.04785,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":52,"nome":"Parada Ibiporã nº 44","cidade":"Ibiporã","categoria":"transporte","lat":-23.267601,"lng":-51.053473,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":53,"nome":"Parada Ibiporã nº 45","cidade":"Ibiporã","categoria":"transporte","lat":-23.26862,"lng":-51.055171,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":54,"nome":"Parada Ibiporã nº 46","cidade":"Ibiporã","categoria":"transporte","lat":-23.269363,"lng":-51.056996,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":55,"nome":"Parada Ibiporã nº 47","cidade":"Ibiporã","categoria":"transporte","lat":-23.270752,"lng":-51.059467,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":56,"nome":"Parada Ibiporã nº 48","cidade":"Ibiporã","categoria":"transporte","lat":-23.270634,"lng":-51.059546,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":57,"nome":"Parada Ibiporã nº 49","cidade":"Ibiporã","categoria":"transporte","lat":-23.272373,"lng":-51.063008,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":58,"nome":"Parada Ibiporã nº 50","cidade":"Ibiporã","categoria":"transporte","lat":-23.272576,"lng":-51.063026,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":59,"nome":"Parada Ibiporã nº 51","cidade":"Ibiporã","categoria":"transporte","lat":-23.274522,"lng":-51.067236,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":60,"nome":"Parada Ibiporã nº 52","cidade":"Ibiporã","categoria":"transporte","lat":-23.274662,"lng":-51.067132,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":61,"nome":"Parada Ibiporã nº 53","cidade":"Ibiporã","categoria":"transporte","lat":-23.276406,"lng":-51.070966,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":62,"nome":"Parada Ibiporã nº 54","cidade":"Ibiporã","categoria":"transporte","lat":-23.27737,"lng":-51.072871,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":63,"nome":"Parada Ibiporã nº 55","cidade":"Ibiporã","categoria":"transporte","lat":-23.277479,"lng":-51.072798,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":64,"nome":"Parada Ibiporã nº 56","cidade":"Ibiporã","categoria":"transporte","lat":-23.2784,"lng":-51.074946,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":65,"nome":"Parada Ibiporã nº 57","cidade":"Ibiporã","categoria":"transporte","lat":-23.278795,"lng":-51.075358,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":66,"nome":"Parada Ibiporã nº 58","cidade":"Ibiporã","categoria":"transporte","lat":-23.279709,"lng":-51.07755,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":67,"nome":"Parada Ibiporã nº 59","cidade":"Ibiporã","categoria":"transporte","lat":-23.280633,"lng":-51.079403,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":68,"nome":"Parada Ibiporã nº 60","cidade":"Ibiporã","categoria":"transporte","lat":-23.28208,"lng":-51.08228,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":69,"nome":"Parada Ibiporã nº 61","cidade":"Ibiporã","categoria":"transporte","lat":-23.28306,"lng":-51.084236,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":70,"nome":"Parada Ibiporã nº 62","cidade":"Ibiporã","categoria":"transporte","lat":-23.283218,"lng":-51.084176,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":71,"nome":"Parada Ibiporã nº 63","cidade":"Ibiporã","categoria":"transporte","lat":-23.285381,"lng":-51.083212,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":72,"nome":"Parada Ibiporã nº 64","cidade":"Ibiporã","categoria":"transporte","lat":-23.285334,"lng":-51.083157,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":73,"nome":"Parada Ibiporã nº 65","cidade":"Ibiporã","categoria":"transporte","lat":-23.28733,"lng":-51.081803,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":74,"nome":"Parada Ibiporã nº 66","cidade":"Ibiporã","categoria":"transporte","lat":-23.287016,"lng":-51.08184,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":75,"nome":"Parada Ibiporã nº 67","cidade":"Ibiporã","categoria":"transporte","lat":-23.287508,"lng":-51.078762,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":76,"nome":"Parada Ibiporã nº 68","cidade":"Ibiporã","categoria":"transporte","lat":-23.287325,"lng":-51.077004,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":77,"nome":"Parada Ibiporã nº 69","cidade":"Ibiporã","categoria":"transporte","lat":-23.232138,"lng":-51.050353,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":78,"nome":"Parada Ibiporã nº 70","cidade":"Ibiporã","categoria":"transporte","lat":-23.232188,"lng":-51.050435,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":79,"nome":"Parada Ibiporã nº 71","cidade":"Ibiporã","categoria":"transporte","lat":-23.284828,"lng":-51.073029,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":80,"nome":"Parada Ibiporã nº 72","cidade":"Ibiporã","categoria":"transporte","lat":-23.25487,"lng":-51.050628,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":81,"nome":"Parada Ibiporã nº 73","cidade":"Ibiporã","categoria":"transporte","lat":-23.255327,"lng":-51.05039,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":82,"nome":"Parada Ibiporã nº 74","cidade":"Ibiporã","categoria":"transporte","lat":-23.254757,"lng":-51.050252,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":83,"nome":"Parada Ibiporã nº 75","cidade":"Ibiporã","categoria":"transporte","lat":-23.253501,"lng":-51.049923,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":84,"nome":"Parada Ibiporã nº 76","cidade":"Ibiporã","categoria":"transporte","lat":-23.257807,"lng":-51.050533,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":85,"nome":"Parada Ibiporã nº 77","cidade":"Ibiporã","categoria":"transporte","lat":-23.25767,"lng":-51.050374,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":86,"nome":"Parada Ibiporã nº 78","cidade":"Ibiporã","categoria":"transporte","lat":-23.260288,"lng":-51.050754,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":87,"nome":"Parada Ibiporã nº 79","cidade":"Ibiporã","categoria":"transporte","lat":-23.260323,"lng":-51.050619,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":88,"nome":"Parada Ibiporã nº 80","cidade":"Ibiporã","categoria":"transporte","lat":-23.2611,"lng":-51.049988,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":89,"nome":"Parada Ibiporã nº 81","cidade":"Ibiporã","categoria":"transporte","lat":-23.26323,"lng":-51.050818,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":90,"nome":"Parada Ibiporã nº 82","cidade":"Ibiporã","categoria":"transporte","lat":-23.283806,"lng":-51.072741,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":91,"nome":"Parada Ibiporã nº 83","cidade":"Ibiporã","categoria":"transporte","lat":-23.26416,"lng":-51.050834,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":92,"nome":"Parada Ibiporã nº 84","cidade":"Ibiporã","categoria":"transporte","lat":-23.267917,"lng":-51.048696,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":93,"nome":"Parada Ibiporã nº 85","cidade":"Ibiporã","categoria":"transporte","lat":-23.276969,"lng":-51.027742,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":94,"nome":"Parada Ibiporã nº 86","cidade":"Ibiporã","categoria":"transporte","lat":-23.275195,"lng":-51.023948,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":95,"nome":"Parada Ibiporã nº 87","cidade":"Ibiporã","categoria":"transporte","lat":-23.27539,"lng":-51.023867,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":96,"nome":"Parada Ibiporã nº 88","cidade":"Ibiporã","categoria":"transporte","lat":-23.274471,"lng":-51.023997,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":97,"nome":"Parada Ibiporã nº 89","cidade":"Ibiporã","categoria":"transporte","lat":-23.274939,"lng":-51.02671,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":98,"nome":"Parada Ibiporã nº 90","cidade":"Ibiporã","categoria":"transporte","lat":-23.274845,"lng":-51.028289,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":99,"nome":"Parada Ibiporã nº 91","cidade":"Ibiporã","categoria":"transporte","lat":-23.275395,"lng":-51.030084,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":100,"nome":"Parada Ibiporã nº 92","cidade":"Ibiporã","categoria":"transporte","lat":-23.268174,"lng":-51.04399,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":101,"nome":"Terminal Rodoviário José de Rocha Guedes","cidade":"Ibiporã","categoria":"terminal","lat":-23.268179,"lng":-51.043769,"endereco":"Rua Serafim Nunes Dinis","horario":null,"fone":null,"status":"Rodoviária / intermunicipal"},
  {"id":102,"nome":"Terminal Urbano Ibiporã","cidade":"Ibiporã","categoria":"terminal","lat":-23.26813,"lng":-51.043938,"endereco":"Avenida André Sert","horario":null,"fone":null,"status":"Terminal de integração"},
  {"id":104,"nome":"Parada Ideal","cidade":"Londrina","categoria":"transporte","lat":-23.301728,"lng":-51.143301,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["102"]},
  {"id":105,"nome":"200;217","cidade":"Londrina","categoria":"transporte","lat":-23.330324,"lng":-51.155952,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["200","217"]},
  {"id":106,"nome":"Parada Roseira","cidade":"Londrina","categoria":"transporte","lat":-23.353171,"lng":-51.144596,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["202"]},
  {"id":107,"nome":"Parada Londrina nº 1","cidade":"Londrina","categoria":"transporte","lat":-23.331875,"lng":-51.157953,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["217"]},
  {"id":108,"nome":"Parada Londrina nº 2","cidade":"Londrina","categoria":"transporte","lat":-23.261778,"lng":-51.153585,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["405"]},
  {"id":109,"nome":"Av. Guilherme de Almeida, 821","cidade":"Londrina","categoria":"transporte","lat":-23.363675,"lng":-51.145114,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["203","210","215","218","226","260"]},
  {"id":110,"nome":"Avenida Bandeirantes, 1092","cidade":"Londrina","categoria":"transporte","lat":-23.327129,"lng":-51.155889,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":111,"nome":"Avenida Bandeirantes, 1201","cidade":"Londrina","categoria":"transporte","lat":-23.326704,"lng":-51.154762,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["095","203","210","601","603","801","905","913","1910"]},
  {"id":112,"nome":"Avenida Bandeirantes, 840","cidade":"Londrina","categoria":"transporte","lat":-23.327139,"lng":-51.158502,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["217","231","706","802","913","1902","1906"]},
  {"id":113,"nome":"Avenida Bandeirantes, 995c","cidade":"Londrina","categoria":"transporte","lat":-23.326873,"lng":-51.156955,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":114,"nome":"Hospital Zona Norte","cidade":"Londrina","categoria":"transporte","lat":-23.259805,"lng":-51.154302,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["415","425"]},
  {"id":115,"nome":"Hospital Zona Norte","cidade":"Londrina","categoria":"transporte","lat":-23.259835,"lng":-51.154448,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["415","425"]},
  {"id":116,"nome":"Parada Sentido Gávea","cidade":"Londrina","categoria":"transporte","lat":-23.257819,"lng":-51.169514,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["402"]},
  {"id":117,"nome":"Parada Londrina Jataizinho","cidade":"Londrina","categoria":"transporte","lat":-23.307906,"lng":-51.160641,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":118,"nome":"Norte Shopping","cidade":"Londrina","categoria":"transporte","lat":-23.28522,"lng":-51.150753,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":119,"nome":"Parada Londrina nº 3","cidade":"Londrina","categoria":"transporte","lat":-23.32802,"lng":-51.19417,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["306"]},
  {"id":120,"nome":"Parada Londrina nº 4","cidade":"Londrina","categoria":"transporte","lat":-23.325498,"lng":-51.19125,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["904"]},
  {"id":121,"nome":"Parada Londrina nº 5","cidade":"Londrina","categoria":"transporte","lat":-23.388888,"lng":-51.13086,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":122,"nome":"Parada Londrina nº 6","cidade":"Londrina","categoria":"transporte","lat":-23.308877,"lng":-51.15044,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":123,"nome":"Parada Londrina nº 7","cidade":"Londrina","categoria":"transporte","lat":-23.348858,"lng":-51.147446,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":124,"nome":"Parada Londrina nº 8","cidade":"Londrina","categoria":"transporte","lat":-23.340322,"lng":-51.147258,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":125,"nome":"Parada Londrina nº 9","cidade":"Londrina","categoria":"transporte","lat":-23.341704,"lng":-51.147245,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":126,"nome":"Parada Londrina nº 10","cidade":"Londrina","categoria":"transporte","lat":-23.346821,"lng":-51.147255,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":127,"nome":"Parada Londrina nº 11","cidade":"Londrina","categoria":"transporte","lat":-23.344984,"lng":-51.147255,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":128,"nome":"Parada Londrina nº 12","cidade":"Londrina","categoria":"transporte","lat":-23.341881,"lng":-51.147475,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":129,"nome":"Parada Londrina nº 13","cidade":"Londrina","categoria":"transporte","lat":-23.346511,"lng":-51.147456,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":130,"nome":"Parada Londrina nº 14","cidade":"Londrina","categoria":"transporte","lat":-23.349316,"lng":-51.147228,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":131,"nome":"Parada Londrina nº 15","cidade":"Londrina","categoria":"transporte","lat":-23.327718,"lng":-51.15019,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":132,"nome":"Parada Londrina nº 16","cidade":"Londrina","categoria":"transporte","lat":-23.307666,"lng":-51.171039,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":133,"nome":"Parada Londrina nº 17","cidade":"Londrina","categoria":"transporte","lat":-23.308767,"lng":-51.169457,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":134,"nome":"Parada Londrina nº 18","cidade":"Londrina","categoria":"transporte","lat":-23.307618,"lng":-51.16477,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":135,"nome":"Parada Londrina nº 19","cidade":"Londrina","categoria":"transporte","lat":-23.307872,"lng":-51.113891,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":136,"nome":"Parada Londrina nº 20","cidade":"Londrina","categoria":"transporte","lat":-23.310807,"lng":-51.120646,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":137,"nome":"Parada Londrina nº 21","cidade":"Londrina","categoria":"transporte","lat":-23.311323,"lng":-51.11899,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":138,"nome":"Parada Londrina nº 22","cidade":"Londrina","categoria":"transporte","lat":-23.304187,"lng":-51.173115,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":139,"nome":"Parada Londrina nº 23","cidade":"Londrina","categoria":"transporte","lat":-23.311486,"lng":-51.1179,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":140,"nome":"Parada Londrina nº 24","cidade":"Londrina","categoria":"transporte","lat":-23.309722,"lng":-51.117669,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":141,"nome":"Parada Londrina nº 25","cidade":"Londrina","categoria":"transporte","lat":-23.321836,"lng":-51.140807,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":142,"nome":"Parada Londrina nº 26","cidade":"Londrina","categoria":"transporte","lat":-23.324051,"lng":-51.19486,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":143,"nome":"Parada Londrina nº 27","cidade":"Londrina","categoria":"transporte","lat":-23.311887,"lng":-51.157232,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":144,"nome":"Parada Londrina nº 28","cidade":"Londrina","categoria":"transporte","lat":-23.312967,"lng":-51.162837,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":145,"nome":"Parada Londrina nº 29","cidade":"Londrina","categoria":"transporte","lat":-23.292939,"lng":-51.096084,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":146,"nome":"Parada Londrina nº 30","cidade":"Londrina","categoria":"transporte","lat":-23.29274,"lng":-51.095796,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":147,"nome":"Parada Londrina nº 31","cidade":"Londrina","categoria":"transporte","lat":-23.292465,"lng":-51.091427,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":148,"nome":"Parada Londrina nº 32","cidade":"Londrina","categoria":"transporte","lat":-23.325091,"lng":-51.194042,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":149,"nome":"Parada Londrina nº 33","cidade":"Londrina","categoria":"transporte","lat":-23.325957,"lng":-51.1939,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":150,"nome":"Parada Londrina nº 34","cidade":"Londrina","categoria":"transporte","lat":-23.323785,"lng":-51.196885,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":151,"nome":"Parada Londrina nº 35","cidade":"Londrina","categoria":"transporte","lat":-23.32352,"lng":-51.197143,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":152,"nome":"Parada Londrina nº 36","cidade":"Londrina","categoria":"transporte","lat":-23.326189,"lng":-51.197026,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":153,"nome":"Parada Londrina nº 37","cidade":"Londrina","categoria":"transporte","lat":-23.326069,"lng":-51.197379,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":154,"nome":"Parada Londrina nº 38","cidade":"Londrina","categoria":"transporte","lat":-23.325539,"lng":-51.201827,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":155,"nome":"Parada Londrina nº 39","cidade":"Londrina","categoria":"transporte","lat":-23.324367,"lng":-51.207094,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":156,"nome":"Parada Londrina nº 40","cidade":"Londrina","categoria":"transporte","lat":-23.328983,"lng":-51.195322,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":157,"nome":"Parada Londrina nº 41","cidade":"Londrina","categoria":"transporte","lat":-23.327248,"lng":-51.19418,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":158,"nome":"Parada Londrina nº 42","cidade":"Londrina","categoria":"transporte","lat":-23.324356,"lng":-51.203735,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":159,"nome":"Parada Londrina nº 43","cidade":"Londrina","categoria":"transporte","lat":-23.321241,"lng":-51.192485,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":160,"nome":"Parada Londrina nº 44","cidade":"Londrina","categoria":"transporte","lat":-23.320989,"lng":-51.192261,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":161,"nome":"Parada Londrina nº 45","cidade":"Londrina","categoria":"transporte","lat":-23.322139,"lng":-51.193749,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":162,"nome":"Parada Londrina nº 46","cidade":"Londrina","categoria":"transporte","lat":-23.32224,"lng":-51.193956,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":163,"nome":"Parada Londrina nº 47","cidade":"Londrina","categoria":"transporte","lat":-23.321114,"lng":-51.189086,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":164,"nome":"Parada Londrina nº 48","cidade":"Londrina","categoria":"transporte","lat":-23.321262,"lng":-51.188589,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":165,"nome":"Parada Londrina nº 49","cidade":"Londrina","categoria":"transporte","lat":-23.325142,"lng":-51.185836,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":166,"nome":"Parada Londrina nº 50","cidade":"Londrina","categoria":"transporte","lat":-23.326456,"lng":-51.184873,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":167,"nome":"Parada Londrina nº 51","cidade":"Londrina","categoria":"transporte","lat":-23.33135,"lng":-51.180292,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":168,"nome":"Parada Londrina nº 52","cidade":"Londrina","categoria":"transporte","lat":-23.328484,"lng":-51.180316,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":169,"nome":"Parada Londrina nº 53","cidade":"Londrina","categoria":"transporte","lat":-23.329332,"lng":-51.177477,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":170,"nome":"Parada Londrina nº 54","cidade":"Londrina","categoria":"transporte","lat":-23.330394,"lng":-51.176891,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":171,"nome":"Parada Londrina nº 55","cidade":"Londrina","categoria":"transporte","lat":-23.33042,"lng":-51.173952,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":172,"nome":"Parada Londrina nº 56","cidade":"Londrina","categoria":"transporte","lat":-23.332306,"lng":-51.180096,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":173,"nome":"Parada Londrina nº 57","cidade":"Londrina","categoria":"transporte","lat":-23.332582,"lng":-51.183822,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":174,"nome":"Parada Londrina nº 58","cidade":"Londrina","categoria":"transporte","lat":-23.330804,"lng":-51.186348,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":175,"nome":"Parada Londrina nº 59","cidade":"Londrina","categoria":"transporte","lat":-23.32859,"lng":-51.18802,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":176,"nome":"Parada Londrina nº 60","cidade":"Londrina","categoria":"transporte","lat":-23.325666,"lng":-51.190436,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":177,"nome":"Parada Londrina nº 61","cidade":"Londrina","categoria":"transporte","lat":-23.333585,"lng":-51.177648,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":178,"nome":"Parada Londrina nº 62","cidade":"Londrina","categoria":"transporte","lat":-23.334306,"lng":-51.177381,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":179,"nome":"Parada Londrina nº 63","cidade":"Londrina","categoria":"transporte","lat":-23.33593,"lng":-51.177573,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":180,"nome":"Parada Londrina nº 64","cidade":"Londrina","categoria":"transporte","lat":-23.332678,"lng":-51.177349,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":181,"nome":"Parada Londrina nº 65","cidade":"Londrina","categoria":"transporte","lat":-23.329301,"lng":-51.177234,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":182,"nome":"Parada Londrina nº 66","cidade":"Londrina","categoria":"transporte","lat":-23.32667,"lng":-51.177428,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":183,"nome":"Parada Londrina nº 67","cidade":"Londrina","categoria":"transporte","lat":-23.326687,"lng":-51.177141,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":184,"nome":"Parada Londrina nº 68","cidade":"Londrina","categoria":"transporte","lat":-23.323147,"lng":-51.176114,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":185,"nome":"Parada Londrina nº 69","cidade":"Londrina","categoria":"transporte","lat":-23.323203,"lng":-51.176265,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":186,"nome":"Parada Londrina nº 70","cidade":"Londrina","categoria":"transporte","lat":-23.321236,"lng":-51.185032,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":187,"nome":"Parada Londrina nº 71","cidade":"Londrina","categoria":"transporte","lat":-23.321392,"lng":-51.18437,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":188,"nome":"Parada Londrina nº 72","cidade":"Londrina","categoria":"transporte","lat":-23.32133,"lng":-51.182972,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":189,"nome":"Parada Londrina nº 73","cidade":"Londrina","categoria":"transporte","lat":-23.268849,"lng":-51.149362,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":190,"nome":"Parada Londrina nº 74","cidade":"Londrina","categoria":"transporte","lat":-23.267986,"lng":-51.149261,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":191,"nome":"Parada Londrina nº 75","cidade":"Londrina","categoria":"transporte","lat":-23.264589,"lng":-51.151451,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":192,"nome":"Parada Londrina nº 76","cidade":"Londrina","categoria":"transporte","lat":-23.264674,"lng":-51.151774,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":193,"nome":"Parada Londrina nº 77","cidade":"Londrina","categoria":"transporte","lat":-23.263424,"lng":-51.152748,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":194,"nome":"Parada Londrina nº 78","cidade":"Londrina","categoria":"transporte","lat":-23.262708,"lng":-51.153684,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":195,"nome":"Parada Londrina nº 79","cidade":"Londrina","categoria":"transporte","lat":-23.261364,"lng":-51.152357,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":196,"nome":"Parada Londrina nº 80","cidade":"Londrina","categoria":"transporte","lat":-23.331346,"lng":-51.171274,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":197,"nome":"Parada Londrina nº 81","cidade":"Londrina","categoria":"transporte","lat":-23.330909,"lng":-51.172215,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":198,"nome":"Parada Londrina nº 82","cidade":"Londrina","categoria":"transporte","lat":-23.331747,"lng":-51.168817,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":199,"nome":"Parada Londrina nº 83","cidade":"Londrina","categoria":"transporte","lat":-23.331893,"lng":-51.169374,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":200,"nome":"Parada Londrina nº 84","cidade":"Londrina","categoria":"transporte","lat":-23.381895,"lng":-51.129298,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":201,"nome":"Parada Londrina nº 85","cidade":"Londrina","categoria":"transporte","lat":-23.386388,"lng":-51.12961,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":202,"nome":"Parada Londrina nº 86","cidade":"Londrina","categoria":"transporte","lat":-23.386548,"lng":-51.129699,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":203,"nome":"Parada Londrina nº 87","cidade":"Londrina","categoria":"transporte","lat":-23.277367,"lng":-51.183223,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":204,"nome":"Parada Londrina nº 88","cidade":"Londrina","categoria":"transporte","lat":-23.292784,"lng":-51.142501,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":205,"nome":"Parada Londrina nº 89","cidade":"Londrina","categoria":"transporte","lat":-23.345849,"lng":-51.175922,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":206,"nome":"Parada Londrina nº 90","cidade":"Londrina","categoria":"transporte","lat":-23.346478,"lng":-51.175979,"endereco":"Rua João Rogério Ribeiro Bonesi","horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":207,"nome":"Parada Londrina nº 91","cidade":"Londrina","categoria":"transporte","lat":-23.343193,"lng":-51.180284,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":208,"nome":"Parada Londrina nº 92","cidade":"Londrina","categoria":"transporte","lat":-23.303288,"lng":-51.158982,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":209,"nome":"Parada Londrina nº 93","cidade":"Londrina","categoria":"transporte","lat":-23.302105,"lng":-51.157929,"endereco":"Rua Atílio Scudeler","horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":210,"nome":"Parada Londrina nº 94","cidade":"Londrina","categoria":"transporte","lat":-23.301998,"lng":-51.157887,"endereco":"Rua Atílio Scudeler","horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":211,"nome":"Parada Londrina nº 95","cidade":"Londrina","categoria":"transporte","lat":-23.363079,"lng":-51.19936,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":212,"nome":"Parada Londrina nº 96","cidade":"Londrina","categoria":"transporte","lat":-23.258846,"lng":-51.18702,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":213,"nome":"Parada Londrina nº 97","cidade":"Londrina","categoria":"transporte","lat":-23.260703,"lng":-51.187533,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":214,"nome":"Parada Londrina nº 98","cidade":"Londrina","categoria":"transporte","lat":-23.288861,"lng":-51.117597,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":215,"nome":"Parada Londrina nº 99","cidade":"Londrina","categoria":"transporte","lat":-23.286489,"lng":-51.119081,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":216,"nome":"Parada Londrina nº 100","cidade":"Londrina","categoria":"transporte","lat":-23.284282,"lng":-51.118367,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":217,"nome":"Parada Londrina nº 101","cidade":"Londrina","categoria":"transporte","lat":-23.284085,"lng":-51.117541,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":218,"nome":"Parada Londrina nº 102","cidade":"Londrina","categoria":"transporte","lat":-23.284951,"lng":-51.114949,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":219,"nome":"Parada Londrina nº 103","cidade":"Londrina","categoria":"transporte","lat":-23.287246,"lng":-51.113976,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":220,"nome":"Parada Londrina nº 104","cidade":"Londrina","categoria":"transporte","lat":-23.288242,"lng":-51.11352,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":221,"nome":"Parada Londrina nº 105","cidade":"Londrina","categoria":"transporte","lat":-23.289583,"lng":-51.114466,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":222,"nome":"Parada Londrina nº 106","cidade":"Londrina","categoria":"transporte","lat":-23.290417,"lng":-51.116207,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":223,"nome":"Parada Londrina nº 107","cidade":"Londrina","categoria":"transporte","lat":-23.29168,"lng":-51.11939,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":224,"nome":"Parada Londrina nº 108","cidade":"Londrina","categoria":"transporte","lat":-23.291676,"lng":-51.119206,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":225,"nome":"Parada Londrina nº 109","cidade":"Londrina","categoria":"transporte","lat":-23.292583,"lng":-51.118948,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":226,"nome":"Parada Londrina nº 110","cidade":"Londrina","categoria":"transporte","lat":-23.290493,"lng":-51.12042,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":227,"nome":"Parada Londrina nº 111","cidade":"Londrina","categoria":"transporte","lat":-23.288396,"lng":-51.121516,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":228,"nome":"Parada Londrina nº 112","cidade":"Londrina","categoria":"transporte","lat":-23.307878,"lng":-51.15919,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":229,"nome":"Parada Londrina nº 113","cidade":"Londrina","categoria":"transporte","lat":-23.307884,"lng":-51.160007,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":230,"nome":"Parada Londrina nº 114","cidade":"Londrina","categoria":"transporte","lat":-23.341365,"lng":-51.12441,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":231,"nome":"Parada Londrina nº 115","cidade":"Londrina","categoria":"transporte","lat":-23.339522,"lng":-51.123577,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":232,"nome":"Parada Londrina nº 116","cidade":"Londrina","categoria":"transporte","lat":-23.323305,"lng":-51.134501,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":233,"nome":"Parada Londrina nº 117","cidade":"Londrina","categoria":"transporte","lat":-23.257578,"lng":-51.150563,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":234,"nome":"Parada Londrina nº 118","cidade":"Londrina","categoria":"transporte","lat":-23.257805,"lng":-51.150237,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":235,"nome":"Parada Londrina nº 119","cidade":"Londrina","categoria":"transporte","lat":-23.257548,"lng":-51.149991,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":236,"nome":"Parada Londrina nº 120","cidade":"Londrina","categoria":"transporte","lat":-23.257468,"lng":-51.152154,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":237,"nome":"Parada Londrina nº 121","cidade":"Londrina","categoria":"transporte","lat":-23.314342,"lng":-51.157357,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":238,"nome":"Parada Londrina nº 122","cidade":"Londrina","categoria":"transporte","lat":-23.314245,"lng":-51.157698,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":239,"nome":"Parada Londrina nº 123","cidade":"Londrina","categoria":"transporte","lat":-23.260946,"lng":-51.187951,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":240,"nome":"Parada Londrina nº 124","cidade":"Londrina","categoria":"transporte","lat":-23.250935,"lng":-51.18839,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":241,"nome":"Parada Londrina nº 125","cidade":"Londrina","categoria":"transporte","lat":-23.250553,"lng":-51.187775,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":242,"nome":"Parada Londrina nº 126","cidade":"Londrina","categoria":"transporte","lat":-23.260746,"lng":-51.185978,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":243,"nome":"Parada Londrina nº 127","cidade":"Londrina","categoria":"transporte","lat":-23.260958,"lng":-51.185981,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":244,"nome":"Parada Londrina nº 128","cidade":"Londrina","categoria":"transporte","lat":-23.311484,"lng":-51.158911,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":245,"nome":"Parada Londrina nº 129","cidade":"Londrina","categoria":"transporte","lat":-23.310216,"lng":-51.221288,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":246,"nome":"Parada Londrina nº 130","cidade":"Londrina","categoria":"transporte","lat":-23.308533,"lng":-51.223009,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":247,"nome":"Parada Londrina nº 131","cidade":"Londrina","categoria":"transporte","lat":-23.293863,"lng":-51.237429,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":248,"nome":"Parada Londrina nº 132","cidade":"Londrina","categoria":"transporte","lat":-23.295043,"lng":-51.239008,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":249,"nome":"Parada Londrina nº 133","cidade":"Londrina","categoria":"transporte","lat":-23.295675,"lng":-51.23985,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":250,"nome":"Parada Londrina nº 134","cidade":"Londrina","categoria":"transporte","lat":-23.266824,"lng":-51.203578,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":251,"nome":"Parada Londrina nº 135","cidade":"Londrina","categoria":"transporte","lat":-23.266497,"lng":-51.204829,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":252,"nome":"Parada Londrina nº 136","cidade":"Londrina","categoria":"transporte","lat":-23.266792,"lng":-51.203461,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":253,"nome":"Parada Londrina nº 137","cidade":"Londrina","categoria":"transporte","lat":-23.266659,"lng":-51.202516,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":254,"nome":"Parada Londrina nº 138","cidade":"Londrina","categoria":"transporte","lat":-23.266868,"lng":-51.199769,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":255,"nome":"Parada Londrina nº 139","cidade":"Londrina","categoria":"transporte","lat":-23.267001,"lng":-51.200898,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":256,"nome":"Parada Londrina nº 140","cidade":"Londrina","categoria":"transporte","lat":-23.266417,"lng":-51.198393,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":257,"nome":"Parada Londrina nº 141","cidade":"Londrina","categoria":"transporte","lat":-23.26627,"lng":-51.198273,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":258,"nome":"Parada Londrina nº 142","cidade":"Londrina","categoria":"transporte","lat":-23.268326,"lng":-51.201096,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":259,"nome":"Parada Londrina nº 143","cidade":"Londrina","categoria":"transporte","lat":-23.269644,"lng":-51.205985,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":260,"nome":"Parada Londrina nº 144","cidade":"Londrina","categoria":"transporte","lat":-23.268319,"lng":-51.206084,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":261,"nome":"Parada Londrina nº 145","cidade":"Londrina","categoria":"transporte","lat":-23.265083,"lng":-51.188203,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":262,"nome":"Parada Londrina nº 146","cidade":"Londrina","categoria":"transporte","lat":-23.253647,"lng":-51.172259,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":263,"nome":"Parada Londrina nº 147","cidade":"Londrina","categoria":"transporte","lat":-23.252397,"lng":-51.172556,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":264,"nome":"Parada Londrina nº 148","cidade":"Londrina","categoria":"transporte","lat":-23.252727,"lng":-51.173598,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":265,"nome":"Parada Londrina nº 149","cidade":"Londrina","categoria":"transporte","lat":-23.278545,"lng":-51.185481,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":266,"nome":"Parada Londrina nº 150","cidade":"Londrina","categoria":"transporte","lat":-23.280405,"lng":-51.185298,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":267,"nome":"Parada Londrina nº 151","cidade":"Londrina","categoria":"transporte","lat":-23.273658,"lng":-51.191402,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":268,"nome":"Parada Londrina nº 152","cidade":"Londrina","categoria":"transporte","lat":-23.273578,"lng":-51.1914,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":269,"nome":"Parada Londrina nº 153","cidade":"Londrina","categoria":"transporte","lat":-23.274522,"lng":-51.190265,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":270,"nome":"Parada Londrina nº 154","cidade":"Londrina","categoria":"transporte","lat":-23.326017,"lng":-51.160781,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":271,"nome":"Parada Londrina nº 155","cidade":"Londrina","categoria":"transporte","lat":-23.28701,"lng":-51.180398,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":272,"nome":"Parada Londrina nº 156","cidade":"Londrina","categoria":"transporte","lat":-23.311625,"lng":-51.204333,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":273,"nome":"Parada Londrina nº 157","cidade":"Londrina","categoria":"transporte","lat":-23.310493,"lng":-51.20463,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":274,"nome":"Parada Londrina nº 158","cidade":"Londrina","categoria":"transporte","lat":-23.310907,"lng":-51.204726,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":275,"nome":"Parada Londrina nº 159","cidade":"Londrina","categoria":"transporte","lat":-23.309888,"lng":-51.20364,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":276,"nome":"Parada Londrina nº 160","cidade":"Londrina","categoria":"transporte","lat":-23.310231,"lng":-51.203017,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":277,"nome":"Parada Londrina nº 161","cidade":"Londrina","categoria":"transporte","lat":-23.30646,"lng":-51.199946,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":278,"nome":"Parada Londrina nº 162","cidade":"Londrina","categoria":"transporte","lat":-23.30494,"lng":-51.198289,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":279,"nome":"Parada Londrina nº 163","cidade":"Londrina","categoria":"transporte","lat":-23.292676,"lng":-51.091298,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":280,"nome":"Parada Londrina nº 164","cidade":"Londrina","categoria":"transporte","lat":-23.359865,"lng":-51.154127,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":281,"nome":"Parada Londrina nº 165","cidade":"Londrina","categoria":"transporte","lat":-23.34732,"lng":-51.211719,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":282,"nome":"Parada Londrina nº 166","cidade":"Londrina","categoria":"transporte","lat":-23.301392,"lng":-51.1795,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":283,"nome":"Parada Londrina nº 167","cidade":"Londrina","categoria":"transporte","lat":-23.30183,"lng":-51.176242,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":284,"nome":"Parada Londrina nº 168","cidade":"Londrina","categoria":"transporte","lat":-23.37401,"lng":-51.135129,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":285,"nome":"Parada Londrina nº 169","cidade":"Londrina","categoria":"transporte","lat":-23.373937,"lng":-51.135275,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":286,"nome":"Parada Londrina nº 170","cidade":"Londrina","categoria":"transporte","lat":-23.268464,"lng":-51.198409,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":287,"nome":"Parada Londrina nº 171","cidade":"Londrina","categoria":"transporte","lat":-23.268329,"lng":-51.198294,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":288,"nome":"Parada Londrina nº 172","cidade":"Londrina","categoria":"transporte","lat":-23.26719,"lng":-51.169642,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":289,"nome":"Parada Londrina nº 173","cidade":"Londrina","categoria":"transporte","lat":-23.267186,"lng":-51.16976,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":290,"nome":"Parada Londrina nº 174","cidade":"Londrina","categoria":"transporte","lat":-23.26494,"lng":-51.167152,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":291,"nome":"Parada Londrina nº 175","cidade":"Londrina","categoria":"transporte","lat":-23.266968,"lng":-51.172325,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":292,"nome":"Parada Londrina nº 176","cidade":"Londrina","categoria":"transporte","lat":-23.264185,"lng":-51.172268,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":293,"nome":"Parada Londrina nº 177","cidade":"Londrina","categoria":"transporte","lat":-23.261345,"lng":-51.168408,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":294,"nome":"Parada Londrina nº 178","cidade":"Londrina","categoria":"transporte","lat":-23.307006,"lng":-51.1552,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":295,"nome":"Parada Londrina nº 179","cidade":"Londrina","categoria":"transporte","lat":-23.310353,"lng":-51.152286,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":296,"nome":"Parada Londrina nº 180","cidade":"Londrina","categoria":"transporte","lat":-23.307599,"lng":-51.152237,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":297,"nome":"Parada Londrina nº 181","cidade":"Londrina","categoria":"transporte","lat":-23.307619,"lng":-51.161261,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":298,"nome":"Parada Londrina nº 182","cidade":"Londrina","categoria":"transporte","lat":-23.298192,"lng":-51.145699,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":299,"nome":"Parada Londrina nº 183","cidade":"Londrina","categoria":"transporte","lat":-23.311386,"lng":-51.157691,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":300,"nome":"Parada Londrina nº 184","cidade":"Londrina","categoria":"transporte","lat":-23.317235,"lng":-51.162818,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":301,"nome":"Parada Londrina nº 185","cidade":"Londrina","categoria":"transporte","lat":-23.319481,"lng":-51.162816,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":302,"nome":"Parada Londrina nº 186","cidade":"Londrina","categoria":"transporte","lat":-23.31353,"lng":-51.161438,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":303,"nome":"Parada Londrina nº 187","cidade":"Londrina","categoria":"transporte","lat":-23.315362,"lng":-51.155159,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":304,"nome":"Parada Londrina nº 188","cidade":"Londrina","categoria":"transporte","lat":-23.196485,"lng":-51.202032,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":305,"nome":"Parada Londrina nº 189","cidade":"Londrina","categoria":"transporte","lat":-23.250608,"lng":-51.1874,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":306,"nome":"Parada Londrina nº 190","cidade":"Londrina","categoria":"transporte","lat":-23.336459,"lng":-51.148136,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":307,"nome":"Parada Londrina nº 191","cidade":"Londrina","categoria":"transporte","lat":-23.302026,"lng":-51.166743,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":308,"nome":"Parada Londrina nº 192","cidade":"Londrina","categoria":"transporte","lat":-23.302296,"lng":-51.166916,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":309,"nome":"Parada Londrina nº 193","cidade":"Londrina","categoria":"transporte","lat":-23.291776,"lng":-51.147647,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":310,"nome":"Parada Londrina nº 194","cidade":"Londrina","categoria":"transporte","lat":-23.291325,"lng":-51.147234,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":311,"nome":"Parada Londrina nº 195","cidade":"Londrina","categoria":"transporte","lat":-23.309,"lng":-51.151299,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":312,"nome":"Parada Londrina nº 196","cidade":"Londrina","categoria":"transporte","lat":-23.307504,"lng":-51.147932,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":313,"nome":"Parada Londrina nº 197","cidade":"Londrina","categoria":"transporte","lat":-23.31781,"lng":-51.156322,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":314,"nome":"Parada Londrina nº 198","cidade":"Londrina","categoria":"transporte","lat":-23.30959,"lng":-51.155191,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":315,"nome":"Parada Londrina nº 199","cidade":"Londrina","categoria":"transporte","lat":-23.349275,"lng":-51.206511,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":316,"nome":"Parada Londrina nº 200","cidade":"Londrina","categoria":"transporte","lat":-23.349437,"lng":-51.206819,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":317,"nome":"Parada Londrina nº 201","cidade":"Londrina","categoria":"transporte","lat":-23.354564,"lng":-51.201417,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":318,"nome":"Parada Londrina nº 202","cidade":"Londrina","categoria":"transporte","lat":-23.349839,"lng":-51.201222,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":319,"nome":"Parada Londrina nº 203","cidade":"Londrina","categoria":"transporte","lat":-23.266382,"lng":-51.202232,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":320,"nome":"Parada Londrina nº 204","cidade":"Londrina","categoria":"transporte","lat":-23.263076,"lng":-51.19959,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":321,"nome":"Parada Londrina nº 205","cidade":"Londrina","categoria":"transporte","lat":-23.263065,"lng":-51.204998,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":322,"nome":"Parada Londrina nº 206","cidade":"Londrina","categoria":"transporte","lat":-23.261978,"lng":-51.198409,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":323,"nome":"Parada Londrina nº 207","cidade":"Londrina","categoria":"transporte","lat":-23.318866,"lng":-51.16593,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":324,"nome":"Parada Londrina nº 208","cidade":"Londrina","categoria":"transporte","lat":-23.317631,"lng":-51.171704,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":325,"nome":"Parada Londrina nº 209","cidade":"Londrina","categoria":"transporte","lat":-23.316616,"lng":-51.169969,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":326,"nome":"Parada Londrina nº 210","cidade":"Londrina","categoria":"transporte","lat":-23.270305,"lng":-51.20098,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":327,"nome":"Parada Londrina nº 211","cidade":"Londrina","categoria":"transporte","lat":-23.270527,"lng":-51.202174,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":328,"nome":"Parada Londrina nº 212","cidade":"Londrina","categoria":"transporte","lat":-23.270503,"lng":-51.204104,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":329,"nome":"Parada Londrina nº 213","cidade":"Londrina","categoria":"transporte","lat":-23.24746,"lng":-51.158417,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":330,"nome":"Parada Londrina nº 214","cidade":"Londrina","categoria":"transporte","lat":-23.241381,"lng":-51.15681,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":331,"nome":"Parada Londrina nº 215","cidade":"Londrina","categoria":"transporte","lat":-23.37401,"lng":-51.136524,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":332,"nome":"Parada Londrina nº 216","cidade":"Londrina","categoria":"transporte","lat":-23.374408,"lng":-51.136519,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":333,"nome":"Parada Londrina nº 217","cidade":"Londrina","categoria":"transporte","lat":-23.372872,"lng":-51.134644,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":334,"nome":"Parada Londrina nº 218","cidade":"Londrina","categoria":"transporte","lat":-23.373456,"lng":-51.134411,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":335,"nome":"Parada Londrina nº 219","cidade":"Londrina","categoria":"transporte","lat":-23.323349,"lng":-51.16169,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":336,"nome":"Parada Londrina nº 220","cidade":"Londrina","categoria":"transporte","lat":-23.312461,"lng":-51.131265,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":337,"nome":"Parada Londrina nº 221","cidade":"Londrina","categoria":"transporte","lat":-23.282132,"lng":-51.142611,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":338,"nome":"Parada Londrina nº 222","cidade":"Londrina","categoria":"transporte","lat":-23.282361,"lng":-51.143395,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":339,"nome":"Parada Londrina nº 223","cidade":"Londrina","categoria":"transporte","lat":-23.35194,"lng":-51.137224,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":340,"nome":"Parada Londrina nº 224","cidade":"Londrina","categoria":"transporte","lat":-23.350945,"lng":-51.140164,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":341,"nome":"Parada Londrina nº 225","cidade":"Londrina","categoria":"transporte","lat":-23.380347,"lng":-51.111475,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":342,"nome":"Parada Londrina nº 226","cidade":"Londrina","categoria":"transporte","lat":-23.302681,"lng":-51.17891,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":343,"nome":"Parada Londrina nº 227","cidade":"Londrina","categoria":"transporte","lat":-23.302691,"lng":-51.179108,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":344,"nome":"Parada Londrina nº 228","cidade":"Londrina","categoria":"transporte","lat":-23.317504,"lng":-51.145305,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":345,"nome":"Parada Londrina nº 229","cidade":"Londrina","categoria":"transporte","lat":-23.320621,"lng":-51.155165,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":346,"nome":"Parada Londrina nº 230","cidade":"Londrina","categoria":"transporte","lat":-23.320538,"lng":-51.154944,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":347,"nome":"Parada Londrina nº 231","cidade":"Londrina","categoria":"transporte","lat":-23.295009,"lng":-51.175648,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":348,"nome":"Parada Londrina nº 232","cidade":"Londrina","categoria":"transporte","lat":-23.279385,"lng":-51.172812,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":349,"nome":"Parada Londrina nº 233","cidade":"Londrina","categoria":"transporte","lat":-23.279681,"lng":-51.172547,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":350,"nome":"Parada Londrina nº 234","cidade":"Londrina","categoria":"transporte","lat":-23.312903,"lng":-51.163949,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":351,"nome":"Parada Londrina nº 235","cidade":"Londrina","categoria":"transporte","lat":-23.314374,"lng":-51.162532,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":352,"nome":"Parada Londrina nº 236","cidade":"Londrina","categoria":"transporte","lat":-23.319228,"lng":-51.161412,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":353,"nome":"Parada Londrina nº 237","cidade":"Londrina","categoria":"transporte","lat":-23.254403,"lng":-51.140989,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":354,"nome":"Parada Londrina nº 238","cidade":"Londrina","categoria":"transporte","lat":-23.25576,"lng":-51.148616,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":355,"nome":"Parada Londrina nº 239","cidade":"Londrina","categoria":"transporte","lat":-23.25569,"lng":-51.148726,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":356,"nome":"Parada Londrina nº 240","cidade":"Londrina","categoria":"transporte","lat":-23.277332,"lng":-51.165528,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":357,"nome":"Parada Londrina nº 241","cidade":"Londrina","categoria":"transporte","lat":-23.323031,"lng":-51.113602,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":358,"nome":"Parada Londrina nº 242","cidade":"Londrina","categoria":"transporte","lat":-23.322981,"lng":-51.113888,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":359,"nome":"Parada Londrina nº 243","cidade":"Londrina","categoria":"transporte","lat":-23.311179,"lng":-51.13181,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":360,"nome":"Parada Londrina nº 244","cidade":"Londrina","categoria":"transporte","lat":-23.296214,"lng":-51.137525,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":361,"nome":"Parada Londrina nº 245","cidade":"Londrina","categoria":"transporte","lat":-23.323395,"lng":-51.223219,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":362,"nome":"Parada Londrina nº 246","cidade":"Londrina","categoria":"transporte","lat":-23.308729,"lng":-51.139297,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":363,"nome":"Parada Londrina nº 247","cidade":"Londrina","categoria":"transporte","lat":-23.308207,"lng":-51.139174,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":364,"nome":"Parada Londrina nº 248","cidade":"Londrina","categoria":"transporte","lat":-23.290069,"lng":-51.203101,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":365,"nome":"Parada Londrina nº 249","cidade":"Londrina","categoria":"transporte","lat":-23.290143,"lng":-51.203172,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":366,"nome":"Parada Londrina nº 250","cidade":"Londrina","categoria":"transporte","lat":-23.360704,"lng":-51.144239,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":367,"nome":"Parada Londrina nº 251","cidade":"Londrina","categoria":"transporte","lat":-23.361009,"lng":-51.146491,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":368,"nome":"Parada Londrina nº 252","cidade":"Londrina","categoria":"transporte","lat":-23.336486,"lng":-51.143493,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":369,"nome":"Parada Londrina nº 253","cidade":"Londrina","categoria":"transporte","lat":-23.309013,"lng":-51.138389,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":370,"nome":"Parada Londrina nº 254","cidade":"Londrina","categoria":"transporte","lat":-23.308122,"lng":-51.137903,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":371,"nome":"Parada Londrina nº 255","cidade":"Londrina","categoria":"transporte","lat":-23.37247,"lng":-51.129128,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":372,"nome":"Parada Londrina nº 256","cidade":"Londrina","categoria":"transporte","lat":-23.330387,"lng":-51.152431,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":373,"nome":"Parada Londrina nº 257","cidade":"Londrina","categoria":"transporte","lat":-23.331048,"lng":-51.152336,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":374,"nome":"Parada Londrina nº 258","cidade":"Londrina","categoria":"transporte","lat":-23.328822,"lng":-51.153598,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":375,"nome":"Parada Londrina nº 259","cidade":"Londrina","categoria":"transporte","lat":-23.328526,"lng":-51.137426,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":376,"nome":"Parada Londrina nº 260","cidade":"Londrina","categoria":"transporte","lat":-23.328647,"lng":-51.153419,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":377,"nome":"Parada Londrina nº 261","cidade":"Londrina","categoria":"transporte","lat":-23.260776,"lng":-51.145219,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":378,"nome":"Parada Londrina nº 262","cidade":"Londrina","categoria":"transporte","lat":-23.26062,"lng":-51.145334,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":379,"nome":"Parada Londrina nº 263","cidade":"Londrina","categoria":"transporte","lat":-23.32613,"lng":-51.160334,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":380,"nome":"Parada Londrina nº 264","cidade":"Londrina","categoria":"transporte","lat":-23.323874,"lng":-51.155154,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":381,"nome":"Parada Londrina nº 265","cidade":"Londrina","categoria":"transporte","lat":-23.315322,"lng":-51.209893,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":382,"nome":"Parada Londrina nº 266","cidade":"Londrina","categoria":"transporte","lat":-23.314906,"lng":-51.210192,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":383,"nome":"Parada Londrina nº 267","cidade":"Londrina","categoria":"transporte","lat":-23.314454,"lng":-51.209098,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":384,"nome":"Parada Londrina nº 268","cidade":"Londrina","categoria":"transporte","lat":-23.298301,"lng":-51.17847,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":385,"nome":"Parada Londrina nº 269","cidade":"Londrina","categoria":"transporte","lat":-23.29883,"lng":-51.178146,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":386,"nome":"Parada Londrina nº 270","cidade":"Londrina","categoria":"transporte","lat":-23.302105,"lng":-51.174343,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":387,"nome":"Parada Londrina nº 271","cidade":"Londrina","categoria":"transporte","lat":-23.301842,"lng":-51.174543,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":388,"nome":"Parada Londrina nº 272","cidade":"Londrina","categoria":"transporte","lat":-23.300131,"lng":-51.174021,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":389,"nome":"Parada Londrina nº 273","cidade":"Londrina","categoria":"transporte","lat":-23.254102,"lng":-51.166261,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":390,"nome":"Parada Londrina nº 274","cidade":"Londrina","categoria":"transporte","lat":-23.255528,"lng":-51.164995,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":391,"nome":"Parada Londrina nº 275","cidade":"Londrina","categoria":"transporte","lat":-23.254184,"lng":-51.166163,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":392,"nome":"Parada Londrina nº 276","cidade":"Londrina","categoria":"transporte","lat":-23.256357,"lng":-51.165714,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":393,"nome":"Parada Londrina nº 277","cidade":"Londrina","categoria":"transporte","lat":-23.257825,"lng":-51.167568,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":394,"nome":"Parada Londrina nº 278","cidade":"Londrina","categoria":"transporte","lat":-23.334886,"lng":-51.149904,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":395,"nome":"Parada Londrina nº 279","cidade":"Londrina","categoria":"transporte","lat":-23.318233,"lng":-51.170649,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":396,"nome":"Parada Londrina nº 280","cidade":"Londrina","categoria":"transporte","lat":-23.320023,"lng":-51.167565,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":397,"nome":"Parada Londrina nº 281","cidade":"Londrina","categoria":"transporte","lat":-23.338905,"lng":-51.121115,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":398,"nome":"Parada Londrina nº 282","cidade":"Londrina","categoria":"transporte","lat":-23.339485,"lng":-51.120664,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":399,"nome":"Parada Londrina nº 283","cidade":"Londrina","categoria":"transporte","lat":-23.340124,"lng":-51.121719,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":400,"nome":"Parada Londrina nº 284","cidade":"Londrina","categoria":"transporte","lat":-23.34209,"lng":-51.122372,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":401,"nome":"Parada Londrina nº 285","cidade":"Londrina","categoria":"transporte","lat":-23.345014,"lng":-51.123623,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":402,"nome":"Parada Londrina nº 286","cidade":"Londrina","categoria":"transporte","lat":-23.337928,"lng":-51.123984,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":403,"nome":"Parada Londrina nº 287","cidade":"Londrina","categoria":"transporte","lat":-23.338027,"lng":-51.12402,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":404,"nome":"Parada Londrina nº 288","cidade":"Londrina","categoria":"transporte","lat":-23.342061,"lng":-51.122475,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":405,"nome":"Parada Londrina nº 289","cidade":"Londrina","categoria":"transporte","lat":-23.263009,"lng":-51.201078,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":406,"nome":"Parada Londrina nº 290","cidade":"Londrina","categoria":"transporte","lat":-23.327869,"lng":-51.198901,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":407,"nome":"Parada Londrina nº 291","cidade":"Londrina","categoria":"transporte","lat":-23.3241,"lng":-51.194902,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":408,"nome":"Parada Londrina nº 292","cidade":"Londrina","categoria":"transporte","lat":-23.325424,"lng":-51.201835,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":409,"nome":"Parada Londrina nº 293","cidade":"Londrina","categoria":"transporte","lat":-23.323967,"lng":-51.205783,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":410,"nome":"Parada Londrina nº 294","cidade":"Londrina","categoria":"transporte","lat":-23.324151,"lng":-51.203209,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":411,"nome":"Parada Londrina nº 295","cidade":"Londrina","categoria":"transporte","lat":-23.316973,"lng":-51.114681,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":412,"nome":"Parada Londrina nº 296","cidade":"Londrina","categoria":"transporte","lat":-23.320357,"lng":-51.152675,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":413,"nome":"Parada Londrina nº 297","cidade":"Londrina","categoria":"transporte","lat":-23.315529,"lng":-51.156808,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":414,"nome":"Parada Londrina nº 298","cidade":"Londrina","categoria":"transporte","lat":-23.307964,"lng":-51.114405,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":415,"nome":"Parada Londrina nº 299","cidade":"Londrina","categoria":"transporte","lat":-23.3082,"lng":-51.113675,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":416,"nome":"Parada Londrina nº 300","cidade":"Londrina","categoria":"transporte","lat":-23.310471,"lng":-51.165425,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":417,"nome":"Parada Londrina nº 301","cidade":"Londrina","categoria":"transporte","lat":-23.348845,"lng":-51.161403,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":418,"nome":"Parada Londrina nº 302","cidade":"Londrina","categoria":"transporte","lat":-23.348786,"lng":-51.16144,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":419,"nome":"Parada Londrina nº 303","cidade":"Londrina","categoria":"transporte","lat":-23.293299,"lng":-51.236285,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":420,"nome":"Parada Londrina nº 304","cidade":"Londrina","categoria":"transporte","lat":-23.293165,"lng":-51.236107,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":421,"nome":"Parada Londrina nº 305","cidade":"Londrina","categoria":"transporte","lat":-23.28175,"lng":-51.171301,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":422,"nome":"Parada Londrina nº 306","cidade":"Londrina","categoria":"transporte","lat":-23.311227,"lng":-51.148329,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":423,"nome":"Rod. Celso Garcia Cid","cidade":"Londrina","categoria":"transporte","lat":-23.363866,"lng":-51.145291,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["219","270","602","603"]},
  {"id":424,"nome":"Rua Clóvis Beviláqua, 264-350","cidade":"Londrina","categoria":"transporte","lat":-23.333674,"lng":-51.155929,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["217"]},
  {"id":425,"nome":"Rua Mato Grosso, 2069","cidade":"Londrina","categoria":"transporte","lat":-23.326548,"lng":-51.156338,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":426,"nome":"Rua Senador Souza Naves, 1550","cidade":"Londrina","categoria":"transporte","lat":-23.326128,"lng":-51.157815,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":427,"nome":"Rua Senador Souza Naves, 1671-1723","cidade":"Londrina","categoria":"transporte","lat":-23.328014,"lng":-51.157679,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["217"]},
  {"id":428,"nome":"Rua Senador Souza Naves, 1820-1824","cidade":"Londrina","categoria":"transporte","lat":-23.328922,"lng":-51.157842,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["217"]},
  {"id":429,"nome":"Rua das Magnólias, 61","cidade":"Londrina","categoria":"transporte","lat":-23.36185,"lng":-51.142717,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["203","200","218","905"]},
  {"id":430,"nome":"Rua do Trevo Branco, 128-216","cidade":"Londrina","categoria":"transporte","lat":-23.362632,"lng":-51.144593,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["203","207","905"]},
  {"id":431,"nome":"Rua do Trevo Branco, 129","cidade":"Londrina","categoria":"transporte","lat":-23.362551,"lng":-51.144799,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["207","905"]},
  {"id":432,"nome":"Terminal Acapulco","cidade":"Londrina","categoria":"terminal","lat":-23.360392,"lng":-51.155257,"endereco":"Av. Chepli Tanus Daher","horario":null,"fone":null,"status":"Terminal de integração"},
  {"id":436,"nome":"Terminal Milton Gavetti","cidade":"Londrina","categoria":"terminal","lat":-23.281537,"lng":-51.152584,"endereco":"Av. Sylvio Barros","horario":null,"fone":null,"status":"Terminal de integração"},
  {"id":438,"nome":"Terminal Oeste","cidade":"Londrina","categoria":"terminal","lat":-23.297191,"lng":-51.187187,"endereco":"Rua Abélio Benatti","horario":null,"fone":null,"status":"Terminal de integração"},
  {"id":440,"nome":"Terminal Ouro Verde","cidade":"Londrina","categoria":"terminal","lat":-23.281637,"lng":-51.171069,"endereco":null,"horario":null,"fone":null,"status":"Terminal de integração"},
  {"id":441,"nome":"Terminal Rodoviário de Londrina","cidade":"Londrina","categoria":"terminal","lat":-23.309398,"lng":-51.150066,"endereco":"Avenida Dez de Dezembro","horario":null,"fone":"+55 43 3372 1800","status":"Rodoviária / intermunicipal"},
  {"id":443,"nome":"Terminal Shopping Catuaí","cidade":"Londrina","categoria":"terminal","lat":-23.34375,"lng":-51.18624,"endereco":null,"horario":null,"fone":null,"status":"Terminal de integração"},
  {"id":444,"nome":"Terminal Central de Londrina","cidade":"Londrina","categoria":"terminal","lat":-23.308294,"lng":-51.160859,"endereco":"Av. Leste-Oeste (Terminal Urbano Central)","horario":null,"fone":null,"status":"Terminal de integração"},
  {"id":452,"nome":"Terminal Vivi Xavier","cidade":"Londrina","categoria":"terminal","lat":-23.260766,"lng":-51.172911,"endereco":"Rua Joubert de Carvalho","horario":null,"fone":null,"status":"Terminal de integração"},
  {"id":454,"nome":"Transportes Coletivos Grande Londrina","cidade":"Londrina","categoria":"transporte","lat":-23.293809,"lng":-51.156778,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus"},
  {"id":455,"nome":"UPA","cidade":"Londrina","categoria":"transporte","lat":-23.315193,"lng":-51.209462,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["314","317"]},
  {"id":456,"nome":"Ônibus","cidade":"Londrina","categoria":"transporte","lat":-23.275939,"lng":-51.16305,"endereco":null,"horario":null,"fone":null,"status":"Ponto de ônibus","linhas":["420"]}
];



const TELA_PAI = {
  'tela-transporte': 'menu-principal',
  'tela-cartoes': 'menu-principal',
  'tela-mapas': 'menu-principal',
  'tela-ajuda': 'menu-principal',
  'tela-saldo': 'tela-cartoes',
  'tela-extrato': 'tela-cartoes',
  'tela-recarga': 'tela-cartoes',
  'tela-bloqueio': 'tela-cartoes',
  'tela-carregamento': 'tela-cartoes',
  'tela-tipos-cartao': 'tela-cartoes'
};

let telaAtual = 'tela-inicial';

// ===== 3. Navegação com Renderização do Mapa =====
function mostrarTela(idDaTela) {
  telaAtual = idDaTela;

  telas.forEach(t => t.classList.toggle('ativa', t.id === idDaTela));
  atualizarBarra(idDaTela);

  if (idDaTela === 'tela-mapas') {
    setTimeout(() => {
      if (!mapaInstancia) {
        inicializarMapa();
      }
      if (mapaInstancia) {
        mapaInstancia.invalidateSize(true);
      }
      obterGeolocalizacao();
    }, 300);
  }
}

// ===== 4. Geolocalização =====
function obterGeolocalizacao() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;

        if (estaDentroDosLimites(lat, lng)) {
          usuarioCoordenadas = [lat, lng];
          atualizarMarcadorUsuario("📍 VOCÊ ESTÁ AQUI");
          if (mapaInstancia) mapaInstancia.setView(usuarioCoordenadas, 14);
        } else {
          usuarioCoordenadas = [...CENTRO_LONDRINA];
          atualizarMarcadorUsuario("📍 TOTEM (LONDRINA CENTRO)");
          if (mapaInstancia) mapaInstancia.setView(usuarioCoordenadas, 13);
        }
        if (mapaInstancia) atualizarMapaELista();
      },
      () => {
        usuarioCoordenadas = [...CENTRO_LONDRINA];
        atualizarMarcadorUsuario("📍 TOTEM (LONDRINA CENTRO)");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  } else {
    atualizarMarcadorUsuario("📍 TOTEM (LONDRINA CENTRO)");
  }
}

function atualizarMarcadorUsuario(texto) {
  if (!mapaInstancia) return;

  const userIcon = L.divIcon({
    className: '',
    html: `<div class="user-pin">${texto}</div>`,
    iconSize: [160, 36],
    iconAnchor: [80, 18]
  });

  if (marcadorUsuario) {
    marcadorUsuario.setLatLng(usuarioCoordenadas).setIcon(userIcon);
  } else {
    marcadorUsuario = L.marker(usuarioCoordenadas, { icon: userIcon, zIndexOffset: 1000 }).addTo(mapaInstancia);
  }
}

// ===== 5. Lógica Completa do Mapa =====
function inicializarMapa() {
  const container = document.getElementById('mapa-canvas');
  if (!container) return;

  if (container._leaflet_id && mapaInstancia) {
    mapaInstancia.invalidateSize(true);
    return;
  }

  mapaInstancia = L.map('mapa-canvas', {
    zoomControl: false,
    maxBounds: LIMITES_REGIAO,
    maxBoundsViscosity: 0.85
  }).setView(usuarioCoordenadas, 13);

  camadaTileAtual = L.tileLayer(TILE_LAYERS.dark, {
    maxZoom: 19,
    minZoom: 10,
    subdomains: 'abcd',
    attribution: '© OpenStreetMap © CARTO'
  }).addTo(mapaInstancia);

  marcadoresGrupo = L.layerGroup().addTo(mapaInstancia);

  atualizarMapaELista();

  setTimeout(() => {
    if (mapaInstancia) mapaInstancia.invalidateSize(true);
  }, 100);

  // --- Eventos da Busca ---
  const inputBusca = document.getElementById('busca-local');
  const btnLimpar = document.getElementById('btn-limpar-busca');

  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      const termo = e.target.value.trim();
      btnLimpar.classList.toggle('oculta', termo === '');
      atualizarMapaELista();
    });
  }

  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      inputBusca.value = '';
      btnLimpar.classList.add('oculta');
      atualizarMapaELista();
    });
  }

  // --- Filtro por Cidade ---
  document.querySelectorAll('.btn-cidade').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.btn-cidade').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      atualizarMapaELista();
    };
  });

  // --- Filtro por Categoria ---
  document.querySelectorAll('.btn-filtro').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      atualizarMapaELista();
    };
  });

  // --- Alternador de Camadas ---
  document.querySelectorAll('.btn-camada').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.btn-camada').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      
      const tipoCamada = btn.dataset.camada;
      if (camadaTileAtual) mapaInstancia.removeLayer(camadaTileAtual);

      camadaTileAtual = L.tileLayer(TILE_LAYERS[tipoCamada], {
        maxZoom: 19,
        minZoom: 10,
        subdomains: 'abcd',
        attribution: '© OpenStreetMap / Esri'
      }).addTo(mapaInstancia);
    };
  });

  // --- Controles Touch ---
  document.getElementById('btn-zoom-in').onclick = () => mapaInstancia.zoomIn();
  document.getElementById('btn-zoom-out').onclick = () => mapaInstancia.zoomOut();
  document.getElementById('btn-recentralizar').onclick = () => {
    limparLinhaRota();
    mapaInstancia.setView(usuarioCoordenadas, 14);
    document.getElementById('mapa-detalhes').classList.add('oculta');
    mapaInstancia.invalidateSize(true);
  };

  document.getElementById('btn-fechar-detalhes').onclick = () => {
    document.getElementById('mapa-detalhes').classList.add('oculta');
    limparLinhaRota();
  };
}

function atualizarMapaELista() {
  if (!marcadoresGrupo) return;
  marcadoresGrupo.clearLayers();

  const containerLista = document.getElementById('lista-locais');
  containerLista.innerHTML = '';

  const termoBusca = (document.getElementById('busca-local')?.value || '').toLowerCase();
  const cidadeAtiva = document.querySelector('.btn-cidade.ativo')?.dataset.cidade || 'todas';
  const categoriaAtiva = document.querySelector('.btn-filtro.ativo')?.dataset.categoria || 'tudo';

  atualizarContadoresCategorias(cidadeAtiva, termoBusca);

  const locaisFiltrados = LOCAIS_REGIAO.filter(local => {
    const bateCidade = (cidadeAtiva === 'todas' || local.cidade === cidadeAtiva);
    const bateCategoria = (categoriaAtiva === 'tudo' || local.categoria === categoriaAtiva);
    const bateBusca = local.nome.toLowerCase().includes(termoBusca) ||
                      local.endereco.toLowerCase().includes(termoBusca) ||
                      local.cidade.toLowerCase().includes(termoBusca) ||
                      (local.status && local.status.toLowerCase().includes(termoBusca));

    return bateCidade && bateCategoria && bateBusca;
  });

  if (locaisFiltrados.length === 0) {
    containerLista.innerHTML = `<div class="sem-resultados">Nenhum ponto de ônibus encontrado para os filtros selecionados.</div>`;
    return;
  }

  locaisFiltrados.forEach(local => {
    const dist = calcularDistanciaKm(usuarioCoordenadas[0], usuarioCoordenadas[1], local.lat, local.lng);

    let iconeEmoji = '🚏';
    if (local.categoria === 'terminal') iconeEmoji = '🏢';

    const pinHTML = `<div class="custom-pin ${local.categoria === 'terminal' ? 'terminal' : 'transporte'}"><span>${iconeEmoji}</span></div>`;
    const customIcon = L.divIcon({
      className: '',
      html: pinHTML,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    const m = L.marker([local.lat, local.lng], { icon: customIcon });

    m.bindPopup(`
      <strong style="font-size: 14px; color:#ffc629;">${local.nome}</strong><br>
      <span style="font-size: 12px; color:#ccc;">${local.cidade} • ${dist} km</span>
    `);

    m.on('click', () => {
      selecionarEExibirLocal(local, dist);
    });

    marcadoresGrupo.addLayer(m);

    const card = document.createElement('div');
    card.className = `item-local ${local.categoria === 'terminal' ? 'terminal' : 'transporte'}`;
    card.innerHTML = `
      <div class="item-header-linha">
        <span class="item-titulo">${local.nome}</span>
        <span class="item-distancia">${dist} km</span>
      </div>
      <div class="item-sub">${local.cidade} • ${local.status}</div>
    `;

    card.onclick = () => {
      selecionarEExibirLocal(local, dist);
      m.openPopup();
    };

    containerLista.appendChild(card);
  });
}

function atualizarContadoresCategorias(cidadeAtiva, termoBusca) {
  const contadores = { tudo: 0, transporte: 0, terminal: 0 };

  LOCAIS_REGIAO.forEach(local => {
    const bateCidade = (cidadeAtiva === 'todas' || local.cidade === cidadeAtiva);
    const bateBusca = local.nome.toLowerCase().includes(termoBusca) ||
                      local.endereco.toLowerCase().includes(termoBusca) ||
                      (local.status && local.status.toLowerCase().includes(termoBusca));

    if (bateCidade && bateBusca) {
      contadores.tudo++;
      if (local.categoria === 'transporte') contadores.transporte++;
      if (local.categoria === 'terminal') contadores.terminal++;
    }
  });

  const elTudo = document.getElementById('qtd-tudo');
  const elTransp = document.getElementById('qtd-transporte');
  const elTerm = document.getElementById('qtd-terminal');
  if (elTudo) elTudo.innerText = contadores.tudo;
  if (elTransp) elTransp.innerText = contadores.transporte;
  if (elTerm) elTerm.innerText = contadores.terminal;
}

function selecionarEExibirLocal(local, distancia) {
  desenharLinhaRota(usuarioCoordenadas, [local.lat, local.lng]);

  const bounds = L.latLngBounds([usuarioCoordenadas, [local.lat, local.lng]]);
  mapaInstancia.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });

  exibirDetalhes(local, distancia);
}

function desenharLinhaRota(origem, destino) {
  limparLinhaRota();

  rotaLinha = L.polyline([origem, destino], {
    color: '#ffc629',
    weight: 5,
    opacity: 0.9,
    dashArray: '10, 10',
    className: 'linha-rota-animada'
  }).addTo(mapaInstancia);
}

function limparLinhaRota() {
  if (rotaLinha && mapaInstancia) {
    mapaInstancia.removeLayer(rotaLinha);
    rotaLinha = null;
  }
}

function exibirDetalhes(local, distancia) {
  document.getElementById('detalhe-nome').innerText = local.nome;
  document.getElementById('detalhe-badge').innerText = `${local.cidade} • ${local.status}`;
  document.getElementById('detalhe-distancia').innerText = `📏 ${distancia} km`;
  document.getElementById('detalhe-endereco').innerText = `📍 ${local.endereco}`;
  document.getElementById('detalhe-horario').innerText = `🕒 ${local.horario}`;
  document.getElementById('detalhe-fone').innerText = `📞 ${local.fone}`;

  const tempoPe = Math.max(1, Math.round((distancia / 5) * 60));
  const tempoBus = Math.max(3, Math.round((distancia / 20) * 60 + 5));

  document.getElementById('detalhe-tempo-pe').innerText = `${tempoPe} min`;
  document.getElementById('detalhe-tempo-bus').innerText = `${tempoBus} min`;

  // Rota via Google Maps Directions (transit) + QR Code
  const urlRota = `https://www.google.com/maps/dir/?api=1&origin=${usuarioCoordenadas[0]},${usuarioCoordenadas[1]}&destination=${local.lat},${local.lng}&travelmode=transit`;
  document.getElementById('detalhe-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(urlRota)}`;

  document.getElementById('mapa-detalhes').classList.remove('oculta');
}

// ===== 6. Utilitários Globais =====
function atualizarBarra(idDaTela) {
  barraNav.classList.toggle('oculta', idDaTela === 'tela-inicial');
  botaoVoltar.classList.toggle('invisivel', idDaTela === 'menu-principal');
}

function voltar() {
  const pai = TELA_PAI[telaAtual];
  if (pai) mostrarTela(pai);
}

document.querySelectorAll('[data-abrir]').forEach(b => {
  b.addEventListener('click', () => mostrarTela(b.dataset.abrir));
});

document.querySelectorAll('[data-funcionalidade]').forEach(b => {
  b.addEventListener('click', () => mostrarTela(b.dataset.funcionalidade));
});

botaoVoltar.addEventListener('click', voltar);
botaoCancelar.addEventListener('click', () => confirmacao.classList.remove('oculta'));
botaoSim.addEventListener('click', () => { confirmacao.classList.add('oculta'); mostrarTela('tela-inicial'); });
botaoNao.addEventListener('click', () => confirmacao.classList.add('oculta'));
telaInicial.addEventListener('click', () => mostrarTela('menu-principal'));

mostrarTela('tela-inicial');
