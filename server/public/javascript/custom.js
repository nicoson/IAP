APIHOST = (typeof(APIHOST) == 'undefined') ? "" : APIHOST;
let DATA = [];
let IND = null;

window.onload = function() {
    getList();
    // drawTraceMap();
    // setInterval(getList, 1000);
}

function getList() {
    fetch(APIHOST + '/customlist').then(e => e.json()).then(data => {
        DATA = data;
        fillListTable(data);
    });
}

function fillListTable(data) {
    let list = `<tr>
        <th>序号</th>
        <th>任务名称</th>
        <th>数据源</th>
        <th>疑似图片数量</th>
        <th>疑似视频数量</th>
        <th>已处置数量</th>
        <th>操作</th>
    </tr>`;
    for(let i in data) {
        list += `<tr>
            <td>${Number(i)+1}</td>
            <td class="wxb-common-hover" data-taskid="${data[i].taskid}"  data-index="${i}" onclick="showDetails(event)">${data[i].name}</td>
            <td data-taskid="${data[i].taskid}">${data[i].sitenum}</td>
            <td data-taskid="${data[i].taskid}">${data[i].imgnum}</td>
            <td data-taskid="${data[i].taskid}">${data[i].videonum}</td>
            <td data-taskid="${data[i].taskid}">${Math.floor(data[i].badnum * 0.3)}</td>
            <td>
                <span class="wxb-common-hover" data-taskid="${data[i].taskid}" data-index="${i}" onclick="showConfig(event)">修改配置</span>
                &nbsp;&nbsp;
                <span class="wxb-common-hover" data-taskid="${data[i].taskid}" data-index="${i}" onclick="deleteTask(event)">删除任务</span>
            </td>
        </tr>`;
    }

    document.querySelector('#wxb_list_table').innerHTML = list;
    // addEvent();
}

function showConfig(event) {
    if(event.target.dataset.index != undefined) {
        IND = event.target.dataset.index;
        // showDetail(DATA[event.target.dataset.index].items);
        document.querySelector('#wxb_task_createpanel_title').value = DATA[event.target.dataset.index].name
        document.querySelector('#wxb_list_table_container').setAttribute('class', 'component-hidden');
        document.querySelector('#wxb_task_modal_createpanel').removeAttribute('class');
    }
}

function showDetails(event) {
    document.querySelector('#wxb_list_table_container').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_task_modal_createpanel').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_task_modal_detaillist').removeAttribute('class');
    document.querySelector('#wxb_list_modal_detail_trace').setAttribute('class', 'component-hidden');
}

// ================= router begin ===================
document.querySelector('#wxb_task_btn_createtask').addEventListener('click', (e) => {
    IND = null;
    document.querySelector('#wxb_task_createpanel_title').value = '';
    // document.querySelector('#wxb_task_detail_table').innerHTML = `<tr><th>序号</th><th>任务名称</th><th>监控站点数量</th><th>健康站点数量</th><th>问题站点数量</th><th>违禁内容总量</th><th>生成并导出报告</th></tr>`;
    document.querySelector('#wxb_task_modal_createpanel').removeAttribute('class');
    document.querySelector('#wxb_list_table_container').setAttribute('class', 'component-hidden');
});

document.querySelectorAll('.js-wxb-task-modal-back').forEach(e => e.addEventListener('click', (e) => {
    document.querySelector('#wxb_list_table_container').removeAttribute('class');
    document.querySelector('#wxb_task_modal_createpanel').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_task_modal_detaillist').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_list_modal_detail_trace').setAttribute('class', 'component-hidden');
}));

function goTaskDetailPanel(event) {
    document.querySelector('#wxb_list_table_container').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_task_modal_createpanel').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_task_modal_detaillist').removeAttribute('class');
    console.log(event);
}

function goTaskListPanel() {
    document.querySelector('#wxb_list_table_container').removeAttribute('class');
    document.querySelector('#wxb_task_modal_createpanel').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_task_modal_detaillist').setAttribute('class', 'component-hidden');
}
// ================= router end ===================


document.querySelector('#wxb_task_createpanel_addsite').addEventListener('click', (e) => {
    let title = document.querySelector('#wxb_task_createpanel_title').value;
    // let domain = document.querySelector('#wxb_task_createpanel_domain').value;
    createTask(title);
});

function createTask(title) {
    if(title == '') {
        alert('任务名称不能为空!');
        return;
    }

    if(IND == null) {
        IND = DATA.length;
        DATA.push({
            taskid: Number(DATA.slice(-1)[0].taskid) + 1,
            name: title,
            sitenum: 120,
            imgnum: 0,
            videonum: 0,
            badnum: 0,
            items: []
        });
    } else {
        DATA[IND].name = title;
    }

    updateList();
    goTaskListPanel();
    // document.querySelector('#wxb_task_createpanel_domain').value = '';
    // showDetail(DATA[IND].items);
}

function deleteTask(event) {
    DATA.splice(event.target.dataset.index, 1);
    updateList();
}

function updateList() {
    postBody.body = JSON.stringify({customlist:DATA});
    fetch(APIHOST + '/updatecustomlist', postBody).then(e => {
        console.log('done');
    });
    fillListTable(DATA);
}

document.querySelector('#wxb_list_modal_detail_trace').addEventListener('click', (e) => {
    document.querySelector('#wxb_list_modal_detail_trace').setAttribute('class', 'component-hidden');
});

document.querySelector('#tracemap').addEventListener('click', (e) => {
    e.stopPropagation();
});


// random increase number
function autoIncrease() {
    let ind = Math.ceil(Math.random() * DATA.length);
    document.querySelectorAll('#wxb_list_table td:nth-of-type(6)').forEach(e => {
        e.removeAttribute('class');
    });
    let key = Math.random() > 0.5 ? 3 : 4;
    document.querySelectorAll('#wxb_list_table tr')[ind].children[key].setAttribute('class', 'flipInX');
    document.querySelectorAll('#wxb_list_table tr')[ind].children[key].innerHTML = Number(document.querySelectorAll('#wxb_list_table tr')[ind].children[key].innerHTML) + Math.ceil(Math.random()*10);
}
setInterval(autoIncrease, 1200);

function showTraceMap() {
    drawTraceMap();
    document.querySelector('#wxb_list_modal_detail_trace').removeAttribute('class');
}

function drawTraceMap() {
    var dom = document.getElementById("tracemap");
    var myChart = echarts.init(dom);
    option = null;
    myChart.showLoading();
    fetch(APIHOST + '/tracedata').then(e => e.text()).then(xml => {
        myChart.hideLoading();

        var graph = echarts.dataTool.gexf.parse(xml);
        graph.links.map(item => {
            item.source = Math.floor(Math.random()*76);
            item.target = Math.floor(Math.random()*76);
        });
        graph.nodes.map(item => {
            item.name = `IP:${Math.floor(Math.random()*1000)}.${Math.floor(Math.random()*1000)}.${Math.floor(Math.random()*1000)}.${Math.floor(Math.random()*1000)}`
            item.symbolSize = graph.links.filter(e => e.target == item.id || e.source == item.id).length * 5;
        });
        var categories = [];
        for (var i = 0; i < 9; i++) {
            categories[i] = {
                name: '类目' + i
            };
        }
        graph.nodes.forEach(function (node) {
            node.itemStyle = null;
            node.value = node.symbolSize;
            node.symbolSize /= 1.5;
            node.label = {
                normal: {
                    show: node.symbolSize > 30
                }
            };
            node.category = node.attributes.modularity_class;
        });
        option = {
            title: {
                text: '传播节点图',
                // subtext: 'Default layout',
                top: 'top',
                left: 'middle'
            },
            tooltip: {},
            // legend: [{
            //     // selectedMode: 'single',
            //     data: categories.map(function (a) {
            //         return a.name;
            //     })
            // }],
            animationDuration: 1500,
            animationEasingUpdate: 'quinticInOut',
            series : [
                {
                    name: '传播节点',
                    type: 'graph',
                    layout: 'none',
                    data: graph.nodes,
                    links: graph.links,
                    categories: categories,
                    roam: true,
                    focusNodeAdjacency: true,
                    itemStyle: {
                        normal: {
                            borderColor: '#fff',
                            borderWidth: 1,
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.3)'
                        }
                    },
                    label: {
                        position: 'right',
                        formatter: '{b}'
                    },
                    lineStyle: {
                        color: 'source',
                        curveness: 0.3
                    },
                    emphasis: {
                        lineStyle: {
                            width: 10
                        }
                    }
                }
            ]
        };

        myChart.setOption(option);
    }, 'xml');;
    if (option && typeof option === "object") {
        myChart.setOption(option, true);
    }
}

function toggleAddList() {
    document.querySelector('#wxb_list_modal_addlist').classList.toggle('component-hidden');
}

 
document.querySelector('#wxb_list_modal_addlist').addEventListener('click', (e) => {
    document.querySelector('#wxb_list_modal_addlist').setAttribute('class', 'component-hidden');
});

document.querySelector('#wxb_list_applist').addEventListener('click', (e) => {
    e.stopPropagation();
});