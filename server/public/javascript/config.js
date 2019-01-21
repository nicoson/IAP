// let APIHOST = 'http://localhost:3000';
let APIHOST = 'http://bocaqh5wg0g9.kegate-xs.cloudappl.com';

if(sessionStorage.islogin == undefined || sessionStorage.islogin != 'true') {
    location.href = '/index.html';
} else {
    // document.querySelector('section').removeAttribute('class');
}

// initiate navbar
let page = {
    // home:   '综合信息平台',
    // edit:   '编辑列表',
    // admin:  '列表管理',
    kodo:   '系统自检',
    fusion: '内部自检',
    pili:   '直播自检',
    pool:   '待处理',
    static: '统计'
};
let navbartmp = '';
for(let i in page) {
    navbartmp += `<a href="/${i}.html" ${location.pathname.indexOf(i+'.html')>0?'class="wa-home-nav-selected"':''} target="_self">${page[i]}</a>`;
}
document.querySelector("#navbar").innerHTML = navbartmp;

let headers = new Headers();
headers.append('Content-Type', 'application/json');
let postBody = {
    method: 'POST',
    headers: headers,
    body: null
};
