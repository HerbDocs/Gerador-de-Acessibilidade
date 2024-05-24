// Mostra a interface do usuário (UI) usando o conteúdo HTML fornecido e define suas dimensões
figma.showUI(__html__, { width: 400, height: 270 });

// Definição da família de fontes usada no plugin
const FONT_FAMILY = "Inter";

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

// Mapeamento das descrições personalizadas
const descricaoPersonalizadaMap: { [key: string]: string } = {};

// Inicializando o mapeamento com descrições padrões para elementos dinâmicos
const nomesElementosDinamicosIDS = [
    "Alert", "Sheet", "Action Button", "Contextual Button", "Directional Button", "FAB", "Favorite Button",
    "Fixed Button", "Icon Button", "Like Button", "Main Button", "Shortcut Carousel", "Shortcut Grid",
    "Card Selector List", "List Selector", "Banner Highlight", "Input Date Picker", "Home Header",
    "Navigation Header", "Search Header", "Input text field", "Input text area", "Input currency",
    "Slider currency", "Input search", "Select", "Likert", "Item accordion", "Item default", "Item selector",
    "List", "Modal", "Pagination Dots", "Pagination Number", "Password", "Password Code", "Switch",
    "Checkbox", "Radio button", "Tab", "Table", "Number Badge", "Tag", "Information (tooltip)"
];

// Inicializando o mapeamento com descrições padrões para elementos estáticos
const nomesElementosEstaticosIDS = [
    "Breadcrumb", "Card Base", "Divider", "Chart", "Icon", "Brand", "Avatar", "Slot", "Cardholder",
    "Loading", "Shimmer", "Progress Bar", "Progress Tracker Item", "Progress Tracker Group", "Chip",
    "Title", "Insights", "Subtitle", "Section", "Body", "Label", "Link", "Description (tooltip)"
];

// Populando o mapa de descrições personalizadas com descrições para elementos dinâmicos
nomesElementosDinamicosIDS.forEach(nome => {
    descricaoPersonalizadaMap[nome] = `Nome: ${nome}\nTipo: "Elemento Dinâmico IDS"\nTag HTML: (NULL)\nDescrição de Acessibilidade: (NULL)\nDiretriz WCAG: (NULL)`;
});

// Populando o mapa de descrições personalizadas com descrições para elementos estáticos
nomesElementosEstaticosIDS.forEach(nome => {
    descricaoPersonalizadaMap[nome] = `Nome: ${nome}\nTipo: "Elemento Estático iDS"\nTag HTML: (NULL)\nDescrição de Acessibilidade: (NULL)\nDiretriz WCAG: (NULL)`;
});

// Interface para mensagens entre o plugin e a UI
interface PluginMessage {
    type: string;
}

// Configura a resposta do plugin às mensagens da UI
figma.ui.onmessage = async (message: PluginMessage) => {
    if (message.type === 'criarNovoFrame') {
        await criarFrameListaFramesSelecionados();
        figma.ui.postMessage({ type: 'frameCreated' });
    }
};

// Configurações adicionais para eventos do Figma
figma.on("run", () => {});

figma.on("selectionchange", () => {
    const selection = figma.currentPage.selection;
    console.log(selection.length ? "Selecionado:" : "Nenhum frame selecionado.");
    selection.forEach(frame => console.log(frame.name));
});

// Função assíncrona para criar um nó de texto
async function criarTexto(texto: string, fontSize: number, isBold: boolean = false): Promise<TextNode> {
    await figma.loadFontAsync({ family: "Inter", style: isBold ? "Bold" : "Regular" });
    const textoNode = figma.createText();
    textoNode.fontName = { family: "Inter", style: isBold ? "Bold" : "Regular" };
    textoNode.fontSize = fontSize;
    textoNode.characters = texto;
    return textoNode;
}

// Função principal para criar um novo frame com uma lista dos frames selecionados
async function criarFrameListaFramesSelecionados() {
    const selection = figma.currentPage.selection.filter(node => node.type === "FRAME" || node.type === "INSTANCE");
    if (selection.length === 0) {
        console.log("Erro: Nenhum frame selecionado na página atual.");
        return;
    }

    const xOffset = 200;
    const maxX = Math.max(...selection.map(frame => frame.x + frame.width));

    const novoFrame = figma.createFrame();
    novoFrame.name = "Lista de Frames Selecionados";
    novoFrame.layoutMode = "VERTICAL";
    novoFrame.primaryAxisAlignItems = "MIN";
    novoFrame.counterAxisAlignItems = "MIN";
    novoFrame.paddingTop = 32;
    novoFrame.paddingBottom = 32;
    novoFrame.paddingLeft = 32;
    novoFrame.paddingRight = 32;
    novoFrame.itemSpacing = 16;
    novoFrame.resize(595, novoFrame.height);
    novoFrame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];

    novoFrame.x = maxX + xOffset;
    novoFrame.y = selection[0].y;

    for (const frame of selection) {
        const tipoCamada = tipoCamadaMap[frame.type] || "Desconhecido";
        const tagHtml = getTagHtml(frame.type);
        let descricaoCamada = `Nome: ${frame.name}\nTipo: ${tipoCamada}\nTag HTML: ${tagHtml}\nDescrição de Acessibilidade: (NULL)\nDiretriz WCAG: (NULL)`;

        if (descricaoPersonalizadaMap[frame.name]) {
            descricaoCamada = descricaoPersonalizadaMap[frame.name];
        } else if (nomesElementosDinamicosIDS.some(nome => frame.name.includes(nome))) {
            descricaoCamada = descricaoPersonalizadaMap[frame.name].replace("(NULL)", tagHtml);
        } else if (nomesElementosEstaticosIDS.some(nome => frame.name.includes(nome))) {
            descricaoCamada = descricaoPersonalizadaMap[frame.name].replace("(NULL)", tagHtml);
        }

        const nomeCamada = await criarTexto(frame.name, 24, true);
        const tagHTML = await criarTexto(`Tag HTML: ${tagHtml}`, 14);
        const descricaoAcessibilidade = await criarTexto(`Descrição de Acessibilidade: (NULL)`, 14);
        const diretrizWCAG = await criarTexto(`Diretriz WCAG: (NULL)`, 14);
        const tipo = await criarTexto(`Tipo: ${tipoCamada}`, 14);

        novoFrame.appendChild(nomeCamada);
        novoFrame.appendChild(tagHTML);
        novoFrame.appendChild(descricaoAcessibilidade);
        novoFrame.appendChild(diretrizWCAG);
        novoFrame.appendChild(await criarTexto("Tipo:", 14));
        novoFrame.appendChild(tipo);

        await processarCamadas(frame, novoFrame, "  -");
    }

    novoFrame.resize(595, novoFrame.height);
    novoFrame.layoutMode = "VERTICAL";
    novoFrame.primaryAxisSizingMode = "FIXED";
    novoFrame.counterAxisSizingMode = "AUTO";

    figma.currentPage.appendChild(novoFrame);
    figma.currentPage.selection = [novoFrame];
    figma.viewport.scrollAndZoomIntoView([novoFrame]);
    figma.notify("Novo frame criado com a lista dos frames selecionados.");
    logCamadas(novoFrame);
}

// Função recursiva para processar as camadas dentro de um frame ou instância
async function processarCamadas(node: SceneNode, novoFrame: FrameNode, prefixo: string) {
    if ("children" in node) {
        for (const child of node.children) {
            let tipoCamada = tipoCamadaMap[child.type] || "Desconhecido";
            const tagHtml = getTagHtml(child.type);
            let descricaoCamada = `Nome: ${child.name}\nTipo: ${tipoCamada}\nTag HTML: ${tagHtml}\nDescrição de Acessibilidade: (NULL)\nDiretriz WCAG: (NULL)`;

            if (descricaoPersonalizadaMap[child.name]) {
                descricaoCamada = descricaoPersonalizadaMap[child.name].replace("(NULL)", tagHtml);
            } else if (temPreenchimentoImagem(child)) {
                tipoCamada = "Image";
                descricaoCamada = `Nome: ${child.name}\nTipo: ${tipoCamadaMap["IMAGE"]}\nTag HTML: <img>\nDescrição de Acessibilidade: (NULL)\nDiretriz WCAG: (NULL)`;
            }

            const textoCamadaNode = await criarTexto(descricaoCamada, 14);
            novoFrame.appendChild(textoCamadaNode);
            if (child.type === "FRAME" || child.type === "GROUP" || child.type === "INSTANCE") {
                await processarCamadas(child, novoFrame, `${prefixo}   -`);
            }
        }
    }
}

// Função para obter a tag HTML com base no tipo de camada
function getTagHtml(tipo: string): string {
    switch (tipo) {
        case "FRAME": return "<div>";
        case "TEXT": return "<p>, <span>, <h1> a <h6>";
        case "RECTANGLE": return "<div>, <section>";
        case "ELLIPSE": return "<div>";
        case "LINE": return "<hr>";
        case "INSTANCE": return "<div>, <component>";
        case "IMAGE": return "<img>";
        case "GROUP": return "<div>, <section>";
        case "COMPONENT": return "<div>, <component>";
        case "BOOLEAN_OPERATION": return "<svg> com <path>";
        case "VECTOR": return "<svg>";
        case "STAR": return "<svg> com <polygon>";
        case "POLYGON": return "<svg> com <polygon>";
        case "SLICE": return "<div>";
        case "CANVAS": return "<canvas>";
        default: return "(NULL)";
    }
}

// Verifica se a camada possui preenchimento de imagem
function temPreenchimentoImagem(camada: SceneNode): boolean {
    if (!("fills" in camada)) return false;
    if ((camada as any).fills.length === 0) return false;
    return (camada as any).fills.some((fill: any) => fill.type === "IMAGE");
}

// Função para logar as camadas no console
function logCamadas(frame: FrameNode) {
    console.log("Camadas no novo frame:");
    frame.children.forEach(child => console.log(child.name));
}
