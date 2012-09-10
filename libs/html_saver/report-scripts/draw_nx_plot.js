
function drawNxPlot(filenames, listsOfLengths, title,
                    refLength, div, legendPlaceholder, glossary) {

    var titleHtml = title;
    if (glossary.hasOwnProperty(title)) {
        titleHtml = "<a class='tooltip-link' href='#' rel='tooltip' title='" + title + " "
            + glossary[title] + "'>" + title + "</a>"
    }

    div.html(
        "<div class='plot'>" +
            "<span class='plot-header'>" + titleHtml + "</span>" +
            "<div style='width: 800px; height: 600px;' id='" + title + "-plot-placeholder'></div>" +
        "</div>"
    );

    var plotsN = listsOfLengths.length;
    var plotsData = new Array(plotsN);

    var maxY = 0;

    for (var i = 0; i < plotsN; i++) {
        var lengths = listsOfLengths[i];

        var size = lengths.length;

        var sumLen = 0;
        for (var j = 0; j < lengths.length; j++) {
            sumLen += lengths[j];
        }
        if (refLength) {
            sumLen = refLength;
        }

        plotsData[i] = {
            data: new Array(),
            label: filenames[i],
        };
        plotsData[i].data.push([0.0, lengths[0]]);
        var currentLen = 0;
        var x = 0.0;

        for (var k = 0; k < size; k++) {
            currentLen += lengths[k];
            plotsData[i].data.push([x, lengths[k]]);
            x = currentLen * 100.0 / sumLen;
            plotsData[i].data.push([x, lengths[k]]);
        }

        if (plotsData[i].data[0][1] > maxY) {
            maxY = plotsData[i].data[0][1];
        }

        var lastPt = plotsData[i].data[plotsData[i].data.length-1];
        plotsData[i].data.push([lastPt[0], 0]);
    }

    for (i = 0; i < plotsN; i++) {
        plotsData[i].lines = {
            show: true,
            lineWidth: 1,
        }
    }

//    for (i = 0; i < plotsN; i++) {
//        plotsData[i].points = {
//            show: true,
//            radius: 1,
//            fill: 1,
//            fillColor: false,
//        }
//    }

    var plot = $.plot($('#' + title + '-plot-placeholder'), plotsData, {
            shadowSize: 0,
            colors: ["#FF5900", "#008FFF", "#168A16", "#7C00FF", "#FF0080"],
            legend: {
                container: legendPlaceholder,
                position: 'ne',
                labelBoxBorderColor: '#FFF',
            },
            grid: {
                borderWidth: 1,
            },
            yaxis: {
                min: 0,
                labelWidth: 120,
                reserveSpace: true,
                lineWidth: 0.5,
                color: '#000',
                tickFormatter: getBpTickFormatter(maxY),
                minTickSize: 1,
            },
            xaxis: {
                min: 0,
                max: 100,
                lineWidth: 0.5,
                color: '#000',
                tickFormatter: function (val, axis) {
                    if (val == 100) {
                        return '&nbsp;100%'
                    } else {
                        return val;
                    }
                }
            },
            minTickSize: 1,
        }
    );
}
