APIHOST = (typeof(APIHOST) == 'undefined') ? '' : APIHOST;
let DATA = [];
let USER = {};
let PAGENUM = 0;
let PAGESIZE = 30;
let isScroll = true;
let SEARCHCONFIG = (typeof(localStorage.operateconfig) == 'undefined') ? {
    startDate: getDateString(new Date()),
    endDate: getDateString(new Date()),
    handled: true,
    unhandle: true
} : JSON.parse(localStorage.operateconfig);

window.onload = function() {
    setTimeout(init, 1);
}

function init() {
    document.querySelector('#wa_list_table_datefrom').value = SEARCHCONFIG.startDate;
    document.querySelector('#wa_list_table_dateto').value = getDateString(new Date());
    document.querySelector('#wa_list_table_handled').checked = SEARCHCONFIG.handled;
    document.querySelector('#wa_list_table_specialhandled').checked = SEARCHCONFIG.specialhandled;
    document.querySelector('#wa_list_table_unhandle').checked = SEARCHCONFIG.unhandle;
    document.querySelector('#wa_list_table_checkbox_pulp').checked = SEARCHCONFIG.pulp;
    document.querySelector('#wa_list_table_checkbox_terror').checked = SEARCHCONFIG.terror;
    document.querySelector('#wa_list_table_checkbox_politician').checked = SEARCHCONFIG.politician;
    reloadData(false);
}

function reloadData() {
    DATA = [];
    PAGENUM = 0;
    isScroll = true;
    getTableList(false);
}

function getTableList(isAppend = false) {
    let startDate = document.querySelector('#wa_list_table_datefrom').value;
    let endDate = document.querySelector('#wa_list_table_dateto').value;
    let url = APIHOST + '/getfusiondata';
    let status = [];
    if(document.querySelector('#wa_list_table_handled').checked) {
        status.push(4,6);   //  4+6:    单链、域名处置
    }
    if(document.querySelector('#wa_list_table_specialhandled').checked) {
        status.push(11);    //  11:     特殊处置
    }
    if(document.querySelector('#wa_list_table_unhandle').checked) {
        status.push(2,8);   //  2+8:    单链、域名流转
    }
    postBody.body = JSON.stringify({
        startDate: startDate,
        endDate: endDate,
        score: 0,
        page: PAGENUM,
        size: PAGESIZE,
        pulp: document.querySelector('#wa_list_table_checkbox_pulp').checked,
        terror: document.querySelector('#wa_list_table_checkbox_terror').checked,
        politician: document.querySelector('#wa_list_table_checkbox_politician').checked,
        status: status,
        filetype: 'both',
        orderby: 'update_date'
    });
    toggleLoadingModal();
    fetch(url, postBody).then(e => e.json()).then(data => {
        if(data.list == undefined) {
            DATA = DATA.concat(data.data);
        } else {
            DATA = DATA.concat(data.list);
        }
        if(data.data.length == 0) {
            isScroll = false;
        } else {
            isScroll = true;
        }
        
        
        fillListTable(document.querySelector('#wa_list_table'), data.data, isAppend);
        document.querySelector('#wa_list_result_num span').innerHTML = data.count;
        // genExportTable(DATA);
        toggleLoadingModal();
    });
}

document.querySelector('section').addEventListener('scroll', function(e) {
    if(isScroll && e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 200) {
        console.log('loading ...');
        isScroll = false;
        PAGENUM++;
        getTableList(true);
    }
});

function getUserInfo(ele, info) {
    let url = APIHOST + '/getuserinfobydomain';
    postBody.body = JSON.stringify({
        domain: info.domain
    });
    toggleLoadingModal();
    fetch(url, postBody).then(e => e.json()).then(data => {
        console.log(data);
        fillSubTable(ele, data.uid, data.data, info);
        toggleLoadingModal();
    });
}

function fillListTable(ele, data, isAppend=false) {
    let list = isAppend ? '' : `<tr class="wa-list-table-tr-main">
                                    <th>序号</th>
                                    <th>查处日期</th>
                                    <th>更新日期</th>
                                    <th>文件外链</th>
                                    <th>域名（点击展开详情）</th>
                                    <th>文件名</th>
                                    <th>文件类型</th>
                                    <th>涉嫌违规类型</th>
                                    <th>分值</th>
                                    <th>状态</th>
                                    <th>备注</th>
                                    <th>操作</th>
                                </tr>`;

    for(let i in data) {
        list += `<tr class="wa-list-table-tr-main" data-ind="${PAGENUM*PAGESIZE + Number(i)}">
                    <td><input type="checkbox" class="js-wa-operation-checkbox" data-url="${data[i].url}" data-index=${PAGENUM*PAGESIZE + Number(i)} />&nbsp;${PAGENUM*PAGESIZE + Number(i) + 1}</td>
                    <td>${new Date(data[i].create_date).toJSON().slice(0,19).replace('T', '<br />')}</td>
                    <td>${new Date(data[i].update_date).toJSON().slice(0,19).replace('T', '<br />')}</td>
                    <td class="wa-list-table-wordwrap"><a href="${data[i].url}" target="_blank">${data[i].url}</td>
                    <td class="wa-list-table-wordwrap" onclick="toggleTableRow(event)"><p>${data[i].domain}</p></td>
                    <td class="wa-list-table-wordwrap"><p>${decodeURI(data[i].url.split('/').slice(-1)[0])}</p></td>
                    <td>${data[i].filetype}</td>
                    <td class="wa-list-table-wordwrap">${data[i].illegaltype?data[i].illegaltype.map(e=>e.replace('- undefined','')):''}</td>
                    <td>${Math.floor(parseFloat(data[i].score)*100)/100}</td>
                    <td class="js-wa-list-status">${statusTrans(data[i].status)}</td>
                    <td class="wa-list-table-wordwrap">${(typeof(data[i].notes)=='undefined' || data[i].notes == null)?'无':data[i].notes}</td>
                    <td class="wa-list-table-wordwrap">` + 
                    ((data[i].status == 2) ?
                        `<button class="btn-warning" onclick="updateStatus(event,5)">驳回外链</button>
                        <button class="btn-primary" onclick="updateStatus(event,4)">封禁外链</button>
                        <button class="btn-success" onclick="confirmPanel(event,1,11)">特殊处理</button>` :
                        ((data[i].status == 8) ?
                        `<button class="btn-warning" onclick="updateStatusByDomain(event,5,true)">驳回域名</button>
                        <button class="btn-danger" onclick="updateStatusByDomain(event,6,false)">封禁域名</button>
                        <button class="btn-success" onclick="confirmPanel(event,2,11)">特殊处理</button>` : "已操作")) +
                    `</td>
                </tr>
                <tr class="component-hidden"></tr>`;
    }
    if(isAppend) {
        ele.innerHTML += list;
    } else {
        ele.innerHTML = list;
    }
    loadImg();
}

function fillSubTable(ele, uid, datum, info) {
    let temp = '';
    temp = `<td colspan=15 class="wa-list-table-extendpanel">
                <div>
                    <table class="wa-list-subtable-userinfo">
                        <tr><th>uid</th><td>${uid}</td></tr>
                        <tr><th>域名</th><td>${info.domain}</td></tr>
                        <tr><th>外链地址</th><td>${info.url}</td></tr>
                        <tr><th>名称</th><td>${datum.DeveloperInfo.fullName}</td></tr>
                        <tr><th>联系电话</th><td>${datum.DeveloperInfo.phoneNumber}</td></tr>
                        <tr><th>email</th><td>${datum.DeveloperInfo.email}</td></tr>
                        <tr><th>注册时间</th><td>${(new Date(datum.DeveloperInfo.createAt/1000000)).toJSON().slice(0,-5).replace('T', ' ')}</td></tr>
                        <tr><th>注册IP</th><td>${datum.DeveloperInfo.registerIp}</td></tr>
                        <tr><th>注册城市</th><td>${datum.DeveloperInfo.registerCity}</td></tr>
                        <tr><th>国家</th><td>${datum.DeveloperInfo.registerState}</td></tr>`
    if(isCompany(datum.IdentityInfo.type, datum.IdentityInfo.status)) {
        temp +=         `<tr><th>账号类型</th><td>企业</td></tr>
                        <tr><th>公司名称</th><td>${datum.IdentityInfo.enterprise_name}</td></tr>
                        <tr><th>社会信用号</th><td>${datum.IdentityInfo.enterprise_code}</td></tr>
                        <tr><th>注册地址</th><td>${datum.IdentityInfo.contact_address}</td></tr>
        `
    } else {
        temp +=         `<tr><th>账号类型</th><td>个人</td></tr>`
    }

    temp += `       </table>
                    <table class="wa-list-table-subtable-loginfo">
                        <tr>
                            <th>最近登陆时间</th>
                            <th>最近登陆IP</th>
                            <th>操作</th>
                        </tr>`
    
    for(let i in datum.OpLogs) {
        temp += `<tr>
                    <td>${datum.OpLogs[i].time.slice(0,19).replace('T',' ')}</td>
                    <td>${datum.OpLogs[i].remote_addr}</td>
                    <td>${datum.OpLogs[i].op}</td>
                </tr>`
    }

    temp += `</table>
            </div>
            </td>`

    ele.innerHTML = temp;
}

function genExportTable(data) {
    let temp = `<tbody>
                    <tr>
                        <th>序号</th>
                        <th>查处日期</th>
                        <th>md5</th>
                        <th>etag</th>
                        <th>文件名</th>
                        <th>存储bucket</th>
                        <th>外链Domain</th>
                        <th>外链key</th>
                        <th>文件类型</th>
                        <th>涉嫌违规类型</th>
                        <th>上传日期</th>
                        <th>上传IP</th>
                        <th>端口号</th>
                        <th>用户账号</th>
                        
                        <th>名称</th>
                        <th>联系电话</th>
                        <th>email</th>
                        <th>注册时间</th>
                        <th>注册IP</th>
                        <th>注册城市</th>
                        <th>国家</th>
                        <th>账号类型</th>
                        <th>公司名称</th>
                        <th>社会信用号</th>
                        <th>注册地址</th>
                    </tr>`;
    for(let i in data) {
        temp +=     `<tr>
                        <td>${Number(i)+1}</td>
                        <td>${data[i].updated_at.slice(0,19).replace('T', ' ')}</td>
                        <td>${data[i].md5}</td>
                        <td>${data[i].hash}</td>
                        <td>${data[i].filename}</td>
                        <td>${data[i].tbl}</td>
                        <td>${data[i].domains.join(';')}</td>
                        <td>${data[i].key}</td>
                        <td>${data[i].mimeType}</td>
                        <td>${data[i].type}</td>
                        <td>${getFullTime(data[i].putTime/10000)}</td>
                        <td>${data[i].ip.split(':')[0]}</td>
                        <td>${(data[i].ip.split(':')[1] == undefined) ? '' : data[i].ip.split(':')[1]}</td>
                        <td>${data[i].owner}</td>

                        <td>${USER[data[i].owner].DeveloperInfo.fullName}</td>
                        <td>'${USER[data[i].owner].DeveloperInfo.phoneNumber}</td>
                        <td>${USER[data[i].owner].DeveloperInfo.email}</td>
                        <td>${(new Date(USER[data[i].owner].DeveloperInfo.createAt/1000000)).toJSON().slice(0,-5).replace('T', ' ')}</td>
                        <td>${USER[data[i].owner].DeveloperInfo.registerIp}</td>
                        <td>${USER[data[i].owner].DeveloperInfo.registerCity}</td>
                        <td>${USER[data[i].owner].DeveloperInfo.registerState}</td>
                        <td>${isCompany(USER[data[i].owner].IdentityInfo.type, USER[data[i].owner].IdentityInfo.status)?'企业':'个人'}</td>
                        <td>${USER[data[i].owner].IdentityInfo.enterprise_name}</td>
                        <td>'${USER[data[i].owner].IdentityInfo.enterprise_code}</td>
                        <td>${USER[data[i].owner].IdentityInfo.contact_address}</td>
                    </tr>`;
    }
    document.querySelector('#wa_list_table_export').innerHTML = temp + '</tbody>';
}

function loadImg() {
    let img = document.querySelector('.ja-wa-list-img-placehold');
    if(img == null) return;
    img.onload = function() {
        loadImg();
    }
    let src = img.dataset.src;
    img.classList.toggle('ja-wa-list-img-placehold');
    img.src = src;
}

function getDateString(day) {
    return `${day.getFullYear()}-${(day.getMonth()+101).toString().slice(1)}-${(day.getDate()+100).toString().slice(1)}`;
}

function getFullTime(time) {
    let day = new Date(time)
    return `${day.getFullYear()}-${(day.getMonth()+101).toString().slice(1)}-${(day.getDate()+100).toString().slice(1)} ${(day.getHours()+100).toString().slice(1)}:${(day.getMinutes()+100).toString().slice(1)}:${(day.getSeconds()+100).toString().slice(1)}`;
}

function toggleTableRow(event) {
    // console.log(event);
    if(event.target.nodeName.toUpperCase() == "IMG") {
        event.stopPropagation();
        return;
    }

    let res = event.target.closest('tr').nextElementSibling.classList.toggle('component-hidden');
    // console.log(res)
    if(!res) {
        let info = DATA[event.target.closest('tr').dataset.ind];
        getUserInfo(event.target.closest('tr').nextElementSibling, info);
    }
}

function toggleLoadingModal() {
    document.querySelector('.wa-modal-loading').classList.toggle('component-hidden');
}

function isCompany(type, status) {
    if(status == 4 || status == 5) {
        return false;
    } else if(type == 1 || type == 2) {
        return false;
    } else if(type == 0 && status == 0) {
        return false;
    } else {
        return true;
    }
}

function statusTrans(code) {
    switch(code) {
        case 1:
            return '待审核';
        case 2:
            return '外链违禁流转';
        case 3:
            return '无需处理';
        case 4:
            return '封禁外链';
        case 5:
            return '驳回';
        case 6:
            return '封禁域名';
        case 7:
            return '已失效';
        case 8:
            return '域名违禁流转';
        case 11:
            return '特殊处理';
        default:
            return 'err';
    }
}

function updateStatus(event, status, notes=null) {
    event.stopPropagation();
    let url = APIHOST + '/updatefusionstatus';
    postBody.body = JSON.stringify({
        url: DATA[event.target.closest('tr').dataset.ind].url,
        status: status,
        notes: notes
    });
    toggleLoadingModal();
    let ele = event.target.closest('tr').querySelector('td.js-wa-list-status');
    fetch(url, postBody).then(e => e.json()).then(res => {
        console.log(res);
        if(res.code == 200) {
            // ele.innerHTML = statusTrans(status);
            reloadData();
        }
        // fillSubTable(ele, data, info);
        toggleLoadingModal();
    });
}

function updateStatusByDomain(event, status, isshow, notes=null) {
    event.stopPropagation();

    let url = APIHOST + '/updatefusionstatusbydomain';
    postBody.body = JSON.stringify({
        url: DATA[event.target.closest('tr').dataset.ind].url,
        domain: DATA[event.target.closest('tr').dataset.ind].domain,
        status: status,
        notes: notes,
        isshow: isshow
    });
    toggleLoadingModal();
    fetch(url, postBody).then(e => e.json()).then(res => {
        console.log(res);
        if(res.code == 200) {
            reloadData();
        }
        // fillSubTable(ele, data, info);
        toggleLoadingModal();
    });
}
function changeConfig(event, item) {
    switch(item) {
        case 'startDate':
            SEARCHCONFIG[item] = event.target.value;
            break;
        case 'endDate':
            SEARCHCONFIG[item] = event.target.value;
            break;
        case 'handled':
            SEARCHCONFIG[item] = event.target.checked;
            break;
        case 'specialhandled':
            SEARCHCONFIG[item] = event.target.checked;
            break;
        case 'unhandle':
            SEARCHCONFIG[item] = event.target.checked;
            break;
        case 'pulp':
            SEARCHCONFIG[item] = event.target.checked;
            break;
        case 'terror':
            SEARCHCONFIG[item] = event.target.checked;
            break;
        case 'politician':
            SEARCHCONFIG[item] = event.target.checked;
            break;
    }
    localStorage.operateconfig = JSON.stringify(SEARCHCONFIG);
}

function getLinks(event) {
    let elem = document.querySelectorAll('.js-wa-operation-checkbox:checked');
    let list = [];
    elem.forEach(ele => {
        list.push(ele.dataset['url']);
    });
    let textnode = document.querySelector('#wa_list_operation_bar input');
    textnode.value = list.join(';');
    textnode.select();
    document.execCommand('copy');
    alert('链接已经复制到粘贴板！');
}

function toggleCheckAll(event) {
    let value = document.querySelector('#wa_list_operation_checkall').checked;
    let elem = document.querySelectorAll('.js-wa-operation-checkbox');
    elem.forEach(ele => {
        ele.checked = value;
    });
}

function exportTrigger(event) {
    let table = document.createElement('table');
    let tmp = `<tr class="wa-list-table-tr-main">
                    <th>查处日期</th>
                    <th>文件外链</th>
                    <th>域名</th>
                    <th>文件类型</th>
                    <th>涉嫌违规类型</th>
                    <th>状态</th>
                </tr>`;
    let elem = document.querySelectorAll('.js-wa-operation-checkbox:checked');
    if(elem.length > 0) {
        elem.forEach(ele => {
            let ind = ele.dataset.index;
            tmp += `<tr>
                        <td>${new Date(DATA[ind].create_date).toJSON().slice(0,19).replace('T',' ')}</td>
                        <td><a href="${DATA[ind].url}" target="_blank">${DATA[ind].url}</td>
                        <td><p>${DATA[ind].domain}</p></td>
                        <td>${DATA[ind].filetype}</td>
                        <td>${DATA[ind].illegaltype?DATA[ind].illegaltype.map(e=>e.replace('- undefined','')):''}</td>
                        <td>${statusTrans(DATA[ind].status)}</td>
                    </tr>`
        });
        table.innerHTML = tmp;
        exportExcel(table);
    }
}

function confirmPanel(event, type, status) {
    var notes = window.prompt("请输入备注原因: ","");
    if(notes == null) return;
    if(type == 1) {
        updateStatus(event, status, notes);
    } else {
        updateStatusByDomain(event, status, false, notes);
    }
}


/*==========================================*\
   excel export component: use filesaver.js
\*==========================================*/
var idTmr;
//获取当前浏览器类型
function getExplorer() {
    var explorer = window.navigator.userAgent;
    //ie
    if (explorer.indexOf("MSIE") >= 0) {
        return 'ie';
    }
    //firefox
    else if (explorer.indexOf("Firefox") >= 0) {
        return 'Firefox';
    }
    //Chrome
    else if(explorer.indexOf("Chrome") >= 0){
        return 'Chrome';
    }
    //Opera
    else if(explorer.indexOf("Opera") >= 0){
        return 'Opera';
    }
    //Safari
    else if(explorer.indexOf("Safari") >= 0){
        return 'Safari';
    }
}
  
//获取到类型需要判断当前浏览器需要调用的方法，目前项目中火狐，谷歌，360没有问题
function exportExcel(table) {
    if(getExplorer()=='ie') {
        var curTbl = table;//document.getElementById(tableid);
        var oXL = new ActiveXObject("Excel.Application");
        var oWB = oXL.Workbooks.Add();
        var xlsheet = oWB.Worksheets(1);
        var sel = document.body.createTextRange();
        sel.moveToElementText(curTbl);
        sel.select();
        sel.execCommand("Copy");
        xlsheet.Paste();
        oXL.Visible = true;

        try {
            var fname = oXL.Application.GetSaveAsFilename(`上报文件 ${getDateString(new Date())}.xls`, "Excel Spreadsheets (*.xls), *.xls");
        } catch (e) {
            print("Nested catch caught " + e);
        } finally {
            oWB.SaveAs(fname);
            oWB.Close(savechanges = false);
            oXL.Quit();
            oXL = null;
            idTmr = window.setInterval("Cleanup();", 1);
        }

    } else {
        fname = `违规文件 ${getDateString(new Date())}.xls`;
        tableToExcel(table, fname)
    }
}

function Cleanup() {
    window.clearInterval(idTmr);
    CollectGarbage();
}

//判断浏览器后调用的方法，把table的id传入即可
function tableToExcel(table, name) {
    var template = `<html><head><meta charset="UTF-8"><style>td,th{border: 0.5px solid black;}</style></head><body><table>${table.innerHTML}</table></body></html>`
    var blob = new Blob([template], {
        type: "application/vnd.ms-excel;charset=charset=utf-8"
    });
    saveAs(blob, name);
}


