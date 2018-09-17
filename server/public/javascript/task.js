APIHOST = (typeof(APIHOST) == 'undefined') ? "" : APIHOST;
let DATA = [];
let IND = null;

window.onload = function() {
    getList();
    // drawTraceMap();
    // setInterval(getList, 1000);
}

function getList() {
    fetch(APIHOST + '/tasklist').then(e => e.json()).then(data => {
        DATA = data;
        fillListTable(data);
    });
}

function fillListTable(data) {
    let list = `<tr>
        <th>序号</th>
        <th>任务名称</th>
        <th>鉴黄阈值</th>
        <th>鉴暴阈值</th>
        <th>鉴政阈值</th>
        <th>低俗阈值</th>
        <th>操作</th>
    </tr>`;
    for(let i in data) {
        list += `<tr>
            <td>${Number(i)+1}</td>
            <td class="wxb-common-hover" data-taskid="${data[i].taskid}"  data-index="${i}">${data[i].name}</td>
            <td data-taskid="${data[i].taskid}">${data[i].pulp}</td>
            <td data-taskid="${data[i].taskid}">${data[i].terror}</td>
            <td data-taskid="${data[i].taskid}">${data[i].politician}</td>
            <td data-taskid="${data[i].taskid}">${data[i].disu}</td>
            <td class="wxb-common-hover" data-taskid="${data[i].taskid}" data-index="${i}" onclick="">重置默认值</td>
        </tr>`;
    }

    document.querySelector('#wxb_list_table').innerHTML = list;
    addEvent();
}

function addEvent() {
    document.querySelectorAll('#wxb_list_table td:nth-of-type(2)').forEach(e => {
        e.addEventListener('click', event => {
            if(event.target.dataset.index != undefined) {
                IND = event.target.dataset.index;
                showDetail(DATA[event.target.dataset.index].items);
                document.querySelector('#wxb_task_createpanel_title').value = DATA[event.target.dataset.index].name
                document.querySelector('#wxb_list_table_container').setAttribute('class', 'component-hidden');
                document.querySelector('#wxb_task_modal_createpanel').removeAttribute('class');
            }
        });
    });
}

function showDetail(data) {
    let tmp = `<tr>
                <th>序号</th>
                <th>监控域名</th>
                <th>创建日期</th>
                <th>状态</th>
                <th>违禁内容</th>
                <th>已处置</th>
                <th>发送通知</th>
            </tr>`;

    data.map((datum,ind) => {
        tmp += `<tr>
                    <td>${ind+1}</td>
                    <td>${datum.domain}</td>
                    <td>${datum.create}</td>
                    <td>${datum.status}</td>
                    <td class="wxb-common-hover" onclick="goTaskDetailPanel(event)">${datum.badnum}</td>
                    <td>${Math.floor(datum.badnum*.5)}</td>
                    <td class="wxb-common-hover" onclick="alert('报告已生成并发送到相关单位！')">发送</td>
                </tr>`
    });

    // document.querySelector('#wxb_list_detail_title').innerHTML = user + '网站';
    document.querySelector('#wxb_task_detail_table').innerHTML = tmp;

    // document.querySelector('#wxb_list_table_container').setAttribute('class', 'component-hidden');
    // document.querySelector('#wxb_list_detail_container').removeAttribute('class');
}

document.querySelector('#wxb_task_btn_createtask').addEventListener('click', (e) => {
    IND = null;
    document.querySelector('#wxb_task_createpanel_title').value = '';
    document.querySelector('#wxb_task_detail_table').innerHTML = `<tr><th>序号</th><th>任务名称</th><th>监控站点数量</th><th>健康站点数量</th><th>问题站点数量</th><th>违禁内容总量</th><th>生成并导出报告</th></tr>`;
    document.querySelector('#wxb_task_modal_createpanel').removeAttribute('class');
    document.querySelector('#wxb_list_table_container').setAttribute('class', 'component-hidden');
});

document.querySelectorAll('.js-wxb-task-modal-back').forEach(e => e.addEventListener('click', (e) => {
    document.querySelector('#wxb_list_table_container').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_task_modal_createpanel').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_task_modal_detaillist').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_list_modal_detail_trace').setAttribute('class', 'component-hidden');
    if(e.target.dataset['path'] == 1) {
        document.querySelector('#wxb_list_table_container').removeAttribute('class');
    } else if (e.target.dataset['path'] == 2) {
        document.querySelector('#wxb_task_modal_createpanel').removeAttribute('class');
    } else {
        document.querySelector('#wxb_task_modal_detaillist').removeAttribute('class');
    }
}));


// document.querySelector('#wxb_task_createpanel_addsite').addEventListener('click', (e) => {
//     let title = document.querySelector('#wxb_task_createpanel_title').value;
//     let domain = document.querySelector('#wxb_task_createpanel_domain').value;
//     createTask(title, domain=='' ? []:[domain]);
// });

document.querySelector('#wxb_task_createpanel_addsite').addEventListener('click', (e) => {
    document.querySelector('#wxb_list_table_container').classList.toggle('component-hidden');
    document.querySelector('#wxb_task_modal_createpanel').classList.toggle('component-hidden');
});

function createTask(title, domain) {
    if(title == '') {
        alert('任务名称不能为空!');
        return;
    }

    if(IND == null) {
        IND = DATA.length;
        DATA.push({
            taskid: Number(DATA.slice(-1)[0].taskid) + 1,
            name: title,
            sitenum: 0,
            healthnum: 0,
            issuenum: 0,
            badnum: 0,
            items: []
        });
    } else {
        DATA[IND].name = title;
    }

    if(domain.length > 0) {
        for(let dom of domain) {
            DATA[IND].items.push({
                domain: dom,
                create: (new Date()).toISOString().slice(0,10),
                status: '健康',
                badnum: 0
            });
    
            DATA[IND].sitenum += 1;
            DATA[IND].healthnum += 1;
        }
    }

    // updateList();
    document.querySelector('#wxb_task_createpanel_domain').value = '';
    showDetail(DATA[IND].items);
}

function deleteTask(event) {
    DATA.splice(event.target.dataset.index, 1);
    // updateList();
}

function updateList() {
    postBody.body = JSON.stringify({tasklist:DATA});
    fetch(APIHOST + '/updatetasklist', postBody).then(e => {
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



// ========= add list modal open ===========
document.querySelector('#wxb_task_createpanel_openlist').addEventListener('click', (e) => {
    document.querySelectorAll('#wxb_list_modal_addlist input').forEach(e => {
        e.checked = false;
    });
    document.querySelector('#wxb_list_modal_addlist').removeAttribute('class');
});

document.querySelector('#wxb_task_modal_addlist_submit').addEventListener('click', (e) => {
    let domain = [];
    document.querySelectorAll('#wxb_list_modal_addlist input:checked').forEach(e => {
        domain.push(e.parentElement.parentElement.nextSibling.nextSibling.innerText);
    });
    let title = document.querySelector('#wxb_task_createpanel_title').value;
    createTask(title, domain);
    document.querySelector('#wxb_list_modal_addlist').setAttribute('class', 'component-hidden');
});

document.querySelector('#wxb_list_modal_addlist').addEventListener('click', (e) => {
    document.querySelector('#wxb_list_modal_addlist').setAttribute('class', 'component-hidden');
});

document.querySelector('#wxb_list_applist').addEventListener('click', (e) => {
    e.stopPropagation();
});
// ========= add list modal close ===========


// random increase number
// function autoIncrease() {
//     let ind = Math.ceil(Math.random() * DATA.length);
//     document.querySelectorAll('#wxb_list_table td:nth-of-type(6)').forEach(e => {
//         e.removeAttribute('class');
//     });
//     document.querySelectorAll('#wxb_list_table tr')[ind].children[5].setAttribute('class', 'biggerTrans');
//     document.querySelectorAll('#wxb_list_table tr')[ind].children[5].innerHTML = Number(document.querySelectorAll('#wxb_list_table tr')[ind].children[5].innerHTML) + Math.ceil(Math.random()*10);
// }
// setInterval(autoIncrease, 1000);


function goTaskDetailPanel(event) {
    document.querySelector('#wxb_list_table_container').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_task_modal_createpanel').setAttribute('class', 'component-hidden');
    document.querySelector('#wxb_task_modal_detaillist').removeAttribute('class');
    console.log(event);
}

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