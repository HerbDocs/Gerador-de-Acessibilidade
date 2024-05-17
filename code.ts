// Mostra a interface do usuário (UI) usando o conteúdo HTML fornecido e define suas dimensões
figma.showUI(__html__, { width: 400, height: 270 });

// Definição da família de fontes usada no plugin
const FONT_FAMILY = "Inter";

// Interface para mensagens entre o plugin e a UI
interface PluginMessage {
  type: string;
}

// Função para lidar com mensagens recebidas do plugin
async function handleMessage(message: PluginMessage) {
  // Verifica se a mensagem recebida é do tipo 'criarNovoFrame'
  if (message.type === 'criarNovoFrame') {
    // Chama a função para criar um novo frame com base nos frames selecionados
    await criarFrameListaFramesSelecionados();
  }
}

// Define a função de tratamento de mensagens para a UI
figma.ui.onmessage = handleMessage;

function handleSelectionChange() {
  // Obtém a seleção atual na página
  const selection = figma.currentPage.selection;
  
  // Verifica se há frames selecionados
  if (selection.length === 0) {
    console.log("Nenhum frame selecionado.");
    return;
  }

  // Imprime no console a lista de frames selecionados
  console.log("Selecionado:");
  for (const frame of selection) {
    console.log(frame.name);
  }
}

figma.on("selectionchange", () => {
  // Chama a função para lidar com a mudança de seleção
  handleSelectionChange();
});


// Função para criar um nó de texto com a fonte definida
async function criarTexto(texto: string): Promise<TextNode> {
  // Carrega a fonte assincronamente
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  // Cria um nó de texto
  const textoNode = figma.createText();
  // Define a fonte do nó de texto
  textoNode.fontName = { family: "Inter", style: "Regular" };
  // Define o texto do nó de texto
  textoNode.characters = texto;
  // Retorna o nó de texto criado
  return textoNode;
}

// Função para criar um novo frame com a lista de frames selecionados
async function criarFrameListaFramesSelecionados() {
  // Obtém a seleção na página atual
  const selection = figma.currentPage.selection;
  
  // Verifica se há algum frame selecionado
  if (selection.length === 0) {
    console.log("Erro: Nenhum frame selecionado na página atual.");
    return;
  }

  // Cria um novo frame para a lista de frames selecionados
  const novoFrame = figma.createFrame();
  // Define o nome e o layout do novo frame
  novoFrame.name = "Lista de Frames Selecionados";
  novoFrame.layoutMode = "VERTICAL"; // Define o layout como vertical
  novoFrame.primaryAxisAlignItems = "MIN"; // Alinha os itens ao início do eixo primário
  novoFrame.counterAxisAlignItems = "MIN"; // Alinha os itens ao início do eixo secundário
  novoFrame.paddingTop = 32; // Define o padding superior como 32px
  novoFrame.paddingBottom = 32; // Define o padding inferior como 32px
  novoFrame.paddingLeft = 32; // Define o padding esquerdo como 32px
  novoFrame.paddingRight = 32; // Define o padding direito como 32px
  novoFrame.itemSpacing = 16; // Define o espaçamento entre os itens como 16px
  novoFrame.resize(793.70, 1122.52);

  // Itera sobre os frames selecionados
  for (const frame of selection) {
    // Verifica se o item é um frame
    if (frame.type !== "FRAME") continue;

    // Cria um texto com o nome e o tipo do frame
    const frameLabel = await criarTexto(`- ${frame.name}, Tipo: ${tipoCamadaMap[frame.type] || "Desconhecido"}`);
    // Adiciona o texto ao novo frame
    novoFrame.appendChild(frameLabel);
    // Processa as camadas dentro do frame atual
    await processarCamadas(frame as FrameNode, novoFrame, `  -`);
  }

  // Posiciona o novo frame e o torna selecionado na tela
  novoFrame.x = 0;
  novoFrame.y = 0;
  figma.currentPage.selection = [novoFrame];
  // Faz o viewport se ajustar ao novo frame
  figma.viewport.scrollAndZoomIntoView([novoFrame]);

  // Notifica o usuário sobre a criação do novo frame
  figma.notify("Novo frame criado com a lista dos frames selecionados.");

  // Imprime no console a lista de camadas detectadas no novo frame
  logCamadas(novoFrame);
}




// Função recursiva para processar as camadas dentro de um frame
async function processarCamadas(frame: FrameNode, novoFrame: FrameNode, prefixo: string) {
  for (const child of frame.children) {
    // Obtém o tipo da camada ou define como "Desconhecido" se não mapeado
    let tipoCamada = tipoCamadaMap[child.type] || "Desconhecido";

    // Se o tipo da camada for um retângulo, define como "Retângulo"
    if (child.type === "RECTANGLE") {
      tipoCamada = "Retângulo";
    }

    // Verifica se o preenchimento é uma imagem e atualiza o tipo da camada
    if (temPreenchimentoImagem(child)) {
      tipoCamada = "Image";
    }

    // Cria um texto com o nome e o tipo da camada
    const textoCamadaNode = await criarTexto(`${prefixo} ${child.name}, Tipo: ${tipoCamada}`);
    // Adiciona o texto ao novo frame
    novoFrame.appendChild(textoCamadaNode);

    // Se a camada for um frame ou grupo, processa suas camadas filhas recursivamente
    if (child.type === "FRAME" || child.type === "GROUP") {
      await processarCamadas(child as FrameNode, novoFrame, `${prefixo}   -`);
    }
  }
}

// Função para verificar se o preenchimento de uma camada é uma imagem
function temPreenchimentoImagem(camada: SceneNode): boolean {
  // Verifica se a propriedade 'fills' existe na camada
  if (!("fills" in camada)) return false; // Verifica se a propriedade fills existe
  
  // Verifica se a camada tem preenchimento
  if ((camada as any).fills.length === 0) return false;
  
  // Itera sobre os preenchimentos da camada
  for (const fill of (camada as any).fills) {
    // Se o preenchimento for do tipo "IMAGE", retorna true
    if (fill.type === "IMAGE") return true;
  }
  
  // Se nenhum preenchimento de imagem for encontrado, retorna false
  return false;
}

// Função para imprimir a lista de camadas no console
function logCamadas(frame: FrameNode) {
  console.log("Camadas no novo frame:");
  for (const child of frame.children) {
    console.log(child.name);
  }
}

// Mapeamento dos tipos de camada para descrições mais legíveis
const tipoCamadaMap: { [key: string]: string } = {
  "FRAME": "Frame",
  "TEXT": "Texto",
  "RECTANGLE": "Retângulo",
  "ELLIPSE": "Elipse",
  "LINE": "Linha",
  "INSTANCE": "Instância",
  "IMAGE": "Imagem",
  "GROUP": "Grupo",
  "COMPONENT": "Componente",
  "BOOLEAN_OPERATION": "Operação Booleana",
  "VECTOR": "Vetor",
  "STAR": "Estrela",
  "POLYGON": "Polígono",
  "SLICE": "Slice",
  "CANVAS": "Canvas"
};