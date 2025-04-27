/*
The MIT License (MIT)
... (оставим лицензию без изменений)
*/

INTERLACE_BLOCKS_VERT_OFFSET = false;
INTERLACE_BLOCKS_COLOR = false;
BLOCKS_SHADOW = false;

// Цвета, как в оригинале
var contigsColors = {
    'Nx': '#7437BA',
    'NGx': '#B53778',
    'correct': '#059B00',
    'misassembled': '#DD4343',
    'unaligned': '#8e8e8e',
    'unknown': '#7DA6B9'
};

// Глобальные переменные
var genomeStartPos = 0;
var chartWidth = 1000; // фиксированная ширина, можно адаптировать
var marginLeft = 60;
var blockHeight = 20;
var blockYOffset = 10;

// Ширина и отступы для каждого SVG
var svgWidth = chartWidth + 100;
var svgHeight = 50; // базовая высота для одного графика хромосомы

// Расстояние между графиками хромосом
var verticalGapBetweenChromosomes = 30;

// D3 масштаб для оси X (будет индивидуален для каждой хромосомы)
function createXScale(chrLength) {
    return d3.scale.linear()
        .domain([0, chrLength])
        .range([marginLeft, chartWidth - 40]);
}


// Определяем размеры текста (для подписей, если будут)
var letterSize = 6;  // фиксированное значение (можно измерить через canvas, но для простоты ставим вручную)
var numberSize = 7;

// Убираем features, coverage и сложную структуру, оставляем базовые настройки
var offsetX = 20;
var offsetY = 20;

// Высота одного блока визуализации (одной хромосомы)
var perChromosomeHeight = 50;
var verticalGapBetweenChromosomes = 30;

// Создаём основной контейнер для всех графиков
var chart = d3.select("body").append("div")
    .attr("id", "chart");

// Отступы для возможных подписей и лейаутов
var margin = {
    top: 20,
    right: 15,
    bottom: 15,
    left: marginLeft  // уже определён в первой части
};

// Мы не используем общую `svg` для всех хромосом, а создаём отдельные — в drawChromosome
// Однако, если нужно будет добавить легенду или глобальные подписи — можно использовать
// здесь дополнительный контейнер

// (1) Ось и масштаб пока не нужны — ты работаешь с фиксированной шириной

// (2) Основной массив для хранения данных по блокам, если нужно будет обрабатывать
var visItems = null;

// (3) Добавим реакцию на клавиатуру, если понадобится в будущем
d3.select('body').on("keypress", function (event) {
    console.log("Нажата клавиша:", event.key);
});
d3.select('body').on("keydown", function (event) {
    // Можно добавить hotkeys
});


// ⚠️ Не рисуем никаких стрелок/маркеров, они не нужны в твоей логике

// 🔻 Если ты решишь в будущем добавить линии между хромосомами, можно будет вернуть:
var separatedLines = [];


// Слой для подписей к блокам (например, имена contig'ов)
var textLayer = d3.select("#chart")
    .append("div")
    .attr("id", "label_layer");


var contigInfoWidth = 240;
var marginRight = 15;
var marginLeft = 155;

var width = ((window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth)
    - contigInfoWidth - marginRight - marginLeft - 50);


// Дополнительно: для совместимости с addLabels или label rendering
var linesLabelsLayer = d3.select("#chart")
    .append("svg")
    .attr("id", "lines_labels")
    .attr("width", width)
    .attr("height", 0)  // не нужен пока
    .style("display", "none");

var itemLines = linesLabelsLayer.append("g");
var itemLabels = linesLabelsLayer.append("g");
var visRectsAndPaths = [];

// (Всё, что ниже — НЕ нужно)
function isOverlapping(block, lane) {
    if (!lane) return false;
    return lane.some(function (other) {
        return block.corr_start <= other.corr_end && other.corr_start <= block.corr_end;
    });
}

// Простейшее описание сборки, можно адаптировать под tooltip
function addAssemblyDescription(lanes) {
    lanes.forEach(function (lane) {
        if (lane.label) {
            var assemblyName = lane.label;
            var desc = assemblyName + '\n';
            desc += 'length: ' + (assemblies_len[assemblyName] || '-') + '\n';
            desc += 'contigs: ' + (assemblies_contigs[assemblyName] || '-') + '\n';
            desc += 'misassemblies: ' + (assemblies_misassemblies[assemblyName] || '-');
            lane.description = desc;
        }
    });
    return lanes;
}

// Упрощённая версия collapseLanes — без nonOverlapping logic и без gene-слоёв
function collapseLanes(chart) {
    var lanes = [], items = [], laneId = 0, itemId = 0, groupId = 0;

    for (var assemblyName in chart.assemblies) {
        var laneBlocks = chart.assemblies[assemblyName];
        laneBlocks.forEach(function (block) {
            block.lane = laneId;
            block.id = itemId++;
            block.groupId = groupId;
            block.assembly = assemblyName;
            block.triangles = [];

            // Цветовая логика — пусть блок сам знает, какой он
            if (block.misassemblies) block.misassembled = true;
            else block.misassembled = false;

            items.push(block);
            groupId++;
        });

        lanes.push({
            id: laneId,
            label: assemblyName,
            isExpanded: false
        });
        laneId++;
    }

    addAssemblyDescription(lanes);
    return { lanes: lanes, items: items };
}


// Эта функция не обязательна для all_chromosomes.html, но можешь её адаптировать, если захочешь позже добавить покрытие
function setupCoverage() {
    console.warn("Coverage track is not used in all_chromosomes.html view.");
}

// Заглушка для путей покрытия (по аналогии)
function appendPaths(track) {
    track.append('g').attr('class', 'phys_covered').append('path');
    track.append('g').attr('class', 'covered').append('path');
    track.append('g').attr('class', 'gc').append('path');
}

// Упрощённая генерация блоков для мини-графика
function getMiniItems(items) {
    var result = [];
    var curLane = 0;
    var numItem = 0;
    var countSupplementary = 0;

    for (var i = 0; i < items.length; i++) {
        var block = items[i];

        if (block.lane !== curLane) {
            numItem = 0;
            countSupplementary = 0;
        }

        result.push(createMiniItem(block, curLane, numItem, countSupplementary));
        curLane = block.lane;

        if (!block.notActive) numItem++;

        if (block.triangles && block.triangles.length > 0) {
            for (var j = 0; j < block.triangles.length; j++) {
                result.push(createMiniItem(block.triangles[j], curLane, numItem, countSupplementary));
                numItem++;
                countSupplementary++;
            }
        }
    }

    return result;
}

// Генерация одного элемента для отображения в mini-графике (при желании можно использовать позже)
function createMiniItem(block, curLane, numItem, countSupplementary) {
    var miniPathHeight = 10;
    var isSmall = (block.corr_end - block.corr_start) < miniPathHeight;

    var c = block.misassembled ? "misassembled" : "correct";
    if (block.contig_type) c += " " + block.contig_type;
    if (!block.is_best) c += " alternative";

    block.objClass = c;
    block.order = numItem - countSupplementary;

    return {
        objClass: block.objClass,
        start: block.corr_start,
        end: block.corr_end,
        y: block.lane * 10,
        text: block.marks || "",
        id: block.id,
        contig_type: block.contig_type,
        fullContig: true
    };
}


function parseFeaturesData(chr) {
    const lanes = [];
    const features = [];
    let laneId = 0;
    let itemId = 0;

    for (const lane of features_data) {
        let numItems = 0;

        for (let i = 0; i < lane.length; i++) {
            const block = lane[i];
            const chrIndex = references_by_id && references_by_id[block.chr] ? chrContigs.indexOf(references_by_id[block.chr]) : block.chr;

            const featureBlock = {
                ...block,
                lane: laneId,
                id: itemId,
                chr: chrIndex,
                corr_start: block.corr_start ?? block.start,
                corr_end: block.corr_end ?? block.end
            };

            features.push(featureBlock);
            itemId++;
            numItems++;
        }

        if (numItems > 0) {
            lanes.push({
                id: laneId,
                label: lane[0].kind
            });
            laneId++;
        }
    }

    return { lanes, features };
}


function addFeatureTrackItems(annotations, scale) {
    annotations.append('g')
        .selectAll('rect')
        .data(featurePaths)
        .enter()
        .append('rect')
        .attr('class', d => d.objClass || 'feature')
        .attr('x', d => scale(d.corr_start))
        .attr('y', d => d.y)
        .attr('width', d => scale(d.corr_end) - scale(d.corr_start))
        .attr('height', featureMiniHeight)
        .on('mouseenter', selectFeature)
        .on('mouseleave', deselectFeature)
        .on('click', addTooltip);

    // Тексты фичей (если достаточно места)
    const visFeatureTexts = featurePaths.filter(d => scale(d.corr_end) - scale(d.corr_start) > 45);

    annotations.append('g')
        .selectAll('text')
        .data(visFeatureTexts)
        .enter()
        .append('text')
        .attr('class', 'featureLabel')
        .text(d => d.name || `ID=${d.id}`)
        .attr('x', d => scale(d.corr_start) + 3)
        .attr('y', d => d.y + featureMiniHeight / 2 + 3)
        .style('font-size', '10px');
}


function addFeatureTrackInfo(annotations, scale) {
    // Линии между lane-ами
    annotations.append('g')
        .selectAll('.laneLines')
        .data(featuresData.lanes)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', d => Math.round(scale(d.id)) + 0.5)
        .attr('y2', d => Math.round(scale(d.id)) + 0.5)
        .attr('stroke', d => d.label === '' ? 'white' : 'lightgray');

    // Текст названий lane-ов
    annotations.append('g')
        .selectAll('.laneText')
        .data(featuresData.lanes)
        .enter()
        .append('text')
        .attr('class', 'laneText')
        .attr('x', -10)
        .attr('y', d => scale(d.id + 0.5))
        .attr('dy', '.5ex')
        .attr('text-anchor', 'end')
        .text(d => d.label);
}

function getFeaturePaths(features) {
    const result = [];
    let curLane = 0;
    let numItem = 0;

    for (let i = 0; i < features.length; i++) {
        const d = features[i];
        if (d.lane !== curLane) numItem = 0;

        let objClass = "gene";
        if (INTERLACE_BLOCKS_COLOR && numItem % 2 === 0) {
            objClass += " odd";
        }

        const x = x_mini(d.corr_start);
        let y = y_anno_mini(d.lane) + 0.15 * annotationMiniLanesHeight;
        if (objClass.includes("odd")) {
            y += 0.04 * annotationMiniLanesHeight;
        }

        result.push({
            objClass: objClass,
            name: d.name,
            start: d.start,
            end: d.end,
            corr_start: d.corr_start,
            corr_end: d.corr_end,
            id: d.id_,
            y: y,
            x: x,
            lane: d.lane,
            order: i
        });

        curLane = d.lane;
        numItem++;
    }

    return result;
}


function drawChartLanes() {
    main.append('g')
        .selectAll('.laneLines')
        .data(lanes)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', d => Math.round(y_main(d.id)) + 0.5)
        .attr('y2', d => Math.round(y_main(d.id)) + 0.5)
        .attr('stroke', d => d.label === '' ? 'white' : 'lightgray');

    const laneLabelOffsetX = 80;
    addLanesText(main, y_main, lanes, laneLabelOffsetX, true, false);

    mini.append('g')
        .selectAll('.laneLines')
        .data(lanes)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', d => Math.round(y_mini(d.id)) + 0.5)
        .attr('y2', d => Math.round(y_mini(d.id)) + 0.5)
        .attr('stroke', d => d.label === '' ? 'white' : 'lightgray');

    addLanesText(mini, y_mini, lanes, 100, false, false);
}

function addLanesText(track, scale, lanes, laneLabelOffsetX, isMain, addStdoutLink) {
    track.selectAll('.laneText').remove();

    track.selectAll('.laneText')
        .data(lanes)
        .enter()
        .append('text')
        .attr('class', 'laneText')
        .attr('x', -10)
        .attr('y', lane => scale(getExpandedLanesCount(lane.id) + (isMain ? 0.1 : 0.5)))
        .attr('dy', '.5ex')
        .attr('text-anchor', 'end')
        .text(lane => isMain ? lane.description : lane.label);
}


function addLanesBackgrounds() {
    main.selectAll('.lane_bg')
        .data(lanes)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', lane => y_main(lane.id) - 1)
        .attr('width', chartWidth)
        .attr('height', mainLanesHeight + 10)
        .attr('display', 'none')
        .attr('class', 'lane_bg');
}
