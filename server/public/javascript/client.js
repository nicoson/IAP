let key = null;
let FILELIST = [];
let CONFIG = {};
let SCALE = 1;
let DATA = [];

if(sessionStorage.user != undefined) {
    USER = sessionStorage.user;
} else {
    USER = localStorage.user;
    sessionStorage.user = USER;
}
console.log(USER);

window.onload = function() {
    let App = {
        Bucket: "custom-demo-wangxinban",
        SignUrl: "token.php",
        //qiniu test account
        AK: "M-G8vwdVdmKYKk50ZdCcIyizX1ItahHnJN-lWsSG",
        SK: "onBC_RiBMOa6cTvUDmpgpguDNZRz4Q_5oW5bkYlA",
        domain: "http://p8jrba1ok.bkt.clouddn.com/"
    }

    let tk = new TOKEN();
    let token = tk.genToken(App.AK, App.SK, App.Bucket);
        
    let config = {
        useCdnDomain: true,
        region: qiniu.region.z0
    };
        
    let putExtra = {
        fname: "",
        params: {},
        mimeType: null
    };

    CONFIG = {
        token: token,
        putExtra: putExtra, 
        config: config,
        app: App
    };

    document.querySelector('header').innerHTML = USER.toUpperCase() + ' 网站';
    getImgList();
}

function getImgList() {
    fetch(APIHOST + '/clientimglist/' + USER).then(e => e.json()).then(e => {
        console.log(e);
        let tmp = '';
        DATA = e;
        e.map(data => {
            if(data.status == 'forbidden') return;
            tmp += `<img src="${data.url}" />`;
        });
        document.querySelector('#wxb_client_imglist').innerHTML = tmp;
        hideModal();
    })
}

// document.querySelector("#wxb_home_imgselector").addEventListener('change', function(e) {
//     let file = document.querySelector('#wxb_home_imgselector').files[0];
//     key = (new Date()).getTime() + '/' + file.name;
//     // 添加上传dom面板
//     let next = (response) =>{
//         let total = response.total;
//         console.log("进度：" + total.percent + "% ");
//         if(total.percent == 100) {
//             // thereSword();
//             console.log('done');
//         }
//     }
    
//     let subscription;
//     // 调用sdk上传接口获得相应的observable，控制上传和暂停
//     let observable = qiniu.upload(file, key, CONFIG.token, CONFIG.putExtra, CONFIG.config);
//     observable.subscribe(next);
// });

document.querySelector('#wxb_client_imgselector').addEventListener('change', function(e) {
    let files = e.target.files;
    if(files.length == 0) return;
    uploadImages(files);
});

function uploadImages(files) {
    let q = [];
    for(let i=0; i<files.length; i++) {
        q.push(new Promise(function(resolve, reject){
            let key = USER + '/' + files[i].name;
            FILELIST.push(key);
            // 添加上传dom面板
            let next = (response) => {
                let total = response.total;
                console.log("进度：" + total.percent + "% ");
                if(total.percent == 100) {
                    return resolve();
                }
            }
            
            let subscription;
            // 调用sdk上传接口获得相应的observable，控制上传和暂停
            let observable = qiniu.upload(files[i], key, CONFIG.token, CONFIG.putExtra, CONFIG.config);
            observable.subscribe(next);
        }));
    };

    showModal();
    Promise.all(q).then(() => {
        fetch(APIHOST + '/triggerreport').then(e => {
            setTimeout(getImgList, 1000);
        });
    });

}

document.querySelector('#wxb_client_menu_gotoconsole').addEventListener('click', function(e) {
    refreshConsole();
});

document.querySelector('#wxb_client_console_back').addEventListener('click', (e) => {
    getImgList();
    document.querySelector('#wxb_client_userpanel').removeAttribute('class');
    document.querySelector('#wxb_client_adminpanel').setAttribute('class', 'component-hidden');
});

function refreshConsole() {
    showModal();
    fetch(APIHOST + '/clientimglist/' + USER).then(e => e.json()).then(e => {
        let tmp = `<tr>
            <th>序号</th>
            <th>图像</th>
            <th>创建日期</th>
            <th>图片鉴定</th>
            <th>状态</th>
            <th>操作</th>
        </tr>`;
        e.map((data,ind) => {
            let status = '';
            if(data.label != 0) {
                status = '无需处理';
            } else if(data.status == 'new') {
                status = '未处理';
            } else if(data.status == 'forbidden') {
                status = '已处理（禁止）';
            } else if(data.status == 'pass') {
                status = '已处理（放行）';
            }
            tmp += `<tr>
                    <td>${ind+1}</td>
                    <td><a href="${data.url}" target="_blank"><img src="${data.url}" alt=""></a></td>
                    <td>${new Date(data.created)}</td>
                    <td>${data.label == 0?"有害信息":"正常信息"}</td>
                    <td class=${data.status == 'new' && data.label == 0 ? "wxb-client-status-red":"wxb-client-status-green"}>${status}</td>
                    <td><button class="btn-danger" data-id="${ind}">禁止</button><button class="btn-success" data-id="${ind}">放行</button></td>
                </tr>`
        });
        document.querySelector('#wxb_client_console_table').innerHTML = tmp;
        addEvent();

        document.querySelector('#wxb_client_adminpanel').removeAttribute('class');
        document.querySelector('#wxb_client_userpanel').setAttribute('class', 'component-hidden');
        setTimeout(hideModal, 500);
    });
}

function addEvent() {
    document.querySelectorAll('.btn-danger').forEach(e => {
        e.addEventListener('click', ele => {
            fetch(APIHOST + `/forbiddenimg/${USER}/${ele.target.dataset.id}`).then(e => {
                refreshConsole();
            });
        });
    });

    document.querySelectorAll('.btn-success').forEach(e => {
        e.addEventListener('click', ele => {
            fetch(APIHOST + `/passimg/${USER}/${ele.target.dataset.id}`).then(e => {
                refreshConsole();
            });
        });
    });
}

function showModal() {
    document.querySelector('#wxb_loading_modal').removeAttribute('class');
}
function hideModal() {
    document.querySelector('#wxb_loading_modal').setAttribute('class', 'component-hidden');
}