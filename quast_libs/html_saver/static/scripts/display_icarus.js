// display_icarus_all.js

// Инициализация отображения всех хромосом
function initAllChromosomesVisualization() {
    if (typeof references_by_id === 'undefined' || Object.keys(references_by_id).length === 0) {
        console.error("Нет данных для визуализации (references_by_id пуст).");
        document.getElementById("chart").innerHTML = "<div class='warning'>Нет данных для визуализации.</div>";
        return;
    }

    var chartContainer = document.getElementById("chart");

    for (var id in references_by_id) {
        var chrName = references_by_id[id];

        if (!chromosomes_len[chrName] || !contig_data[chrName]) {
            console.warn("Данные отсутствуют для хромосомы: " + chrName);
            continue;
        }

        var chrDiv = document.createElement("div");
        chrDiv.className = "chromosome_chart";
        chrDiv.id = "chart_" + chrName;
        chartContainer.appendChild(chrDiv);

        drawChromosome(chrName, chrDiv.id);
    }
}



// Функция для рисования каждой хромосомы с осью X
function drawChromosome(chrName, containerId) {
    var contigs = contig_data[chrName];
    var chrLength = chromosomes_len[chrName];

    var svgWidth = 1000;
    var svgHeight = 50;
    var marginLeft = 60;

    var svg = d3.select("#" + containerId)
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight + 30);  // Высота увеличена для оси X

    // Создание масштаба для оси X
    var xScale = d3.scale.linear()
        .domain([0, chrLength])
        .range([marginLeft, svgWidth - 40]);

    // Создание оси X
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .ticks(5)  // Количество делений на оси
        .tickFormat(function (d) {
            return d;  // Выводим просто координаты для каждого деления
        });

    // Добавление оси X с тонким стилем
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + svgHeight + ')') // Перемещаем ось в нижнюю часть
        .call(xAxis)  // Применяем ось к графику
        .selectAll("path, line")
        .style("fill", "none")
        .style("stroke", "#000")  // Цвет линии оси
        .style("stroke-width", "0.5px");  // Устанавливаем тонкую ось

    var contigSetNames = Object.keys(contigs);
    var yOffset = 15;

    var rectGroup = svg.append("g").attr("class", "rectGroup");

    for (var i = 0; i < contigSetNames.length; i++) {
        var label = contigSetNames[i];
        var contigList = contigs[label];

        rectGroup.selectAll("rect_" + label)
            .data(contigList)
            .enter()
            .append("rect")
            .each(function (d) {
                changeMisassembledStatus(d);  // 💡 обязательно вызываем!
            })
            .attr("x", function (d) { return xScale(d.start); })
            .attr("y", yOffset)
            .attr("width", function (d) { return Math.max(1, xScale(d.end) - xScale(d.start)); })
            .attr("height", 20)
            .attr("class", function (d) {
                let c = "mainItem";

                if (d.misassembled === "False") {
                    c += " disabled";
                } else if (d.contig_type === "mis_unaligned") {
                    c += " mis_unaligned";
                } else if (d.contig_type === "correct_unaligned") {
                    c += " correct_unaligned";
                } else if (d.contig_type === "ambiguous") {
                    c += " ambiguous";
                } else if (d.contig_type === "unaligned") {
                    c += " unaligned";
                } else if (d.contig_type === "alternative") {
                    c += " alternative";
                } else if (d.contig_type === "disabled") {
                    c += " disabled";
                } else if (d.contig_type === "unknown") {
                    c += " unknown";
                } else if (d.contig_type === "misassembled") {
                    c += " misassembled";
                } else {
                    c += " correct";
                }

                console.log("💡 Assigned class:", c);
                return "contig-block " + c;
            })



            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .on("click", function () {
                var blockData = d3.select(this).datum();
                handleBlockClick(blockData, this);
            })
            .append("title")
            .text(function (d) {
                return d.name + ": " + d.start + " - " + d.end;
            });
    }

    svg.append("text")
        .attr("x", 5)
        .attr("y", svgHeight / 2 + 5)
        .text(chrName)
        .attr("font-size", "14px")
        .attr("fill", "#333");

    svg.selectAll("rect")
        .sort(function (a, b) {
            return d3.ascending(a.start, b.start);
        });
}

// Обновляем информацию при клике на блок
function handleBlockClick(blockData, element) {
    console.log("Clicked block:", blockData);

    d3.selectAll(".contig-block")
        .attr("stroke-width", 0.5);

    d3.select(element)
        .attr("stroke-width", 2.5)
        .attr("stroke", "#000");

    updateInfoPanel(blockData);
}

// Функция обновления панели с информацией о блоке
function updateInfoPanel(blockData) {
    var infoPanel = document.getElementById("block_info");
    if (infoPanel) {
        infoPanel.innerHTML = `
            <b>${blockData.name || "?"}</b><br/>
            Start: ${blockData.start || "?"}<br/>
            End: ${blockData.end || "?"}<br/>
            Contig Type: ${blockData.contig_type || "Unknown"}<br/>
            Is Best: ${blockData.is_best || "False"}<br/>
            Misassemblies: ${blockData.misassemblies || "None"}
        `;
    } else {
        console.warn("info_panel not found in DOM");
    }
}








document.addEventListener("DOMContentLoaded", function () {
    initAllChromosomesVisualization();

});
