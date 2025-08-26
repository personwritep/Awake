// ==UserScript==
// @name        Awake
// @namespace        http://tampermonkey.net/
// @version        3.0
// @description        アクセスレポートの更新を背景色で表示・解析ページを「今日」で開く
// @author        Ameba Blog User
// @match        https://blog.ameba.jp/ucs/analysis*
// @match        https://blog.ameba.jp/ucs/top*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=ameba.jp
// @grant        none
// @updateURL        https://github.com/personwritep/Awake/raw/main/Awake.user.js
// @downloadURL        https://github.com/personwritep/Awake/raw/main/Awake.user.js
// ==/UserScript==


let path=location.pathname;
if(path=='/ucs/top.do'){ // 管理トップ で実行

    let realtime=document.querySelector('.accessAnalysis__dailyAccess');
    if(realtime){
        realtime.style.cursor='pointer';
        realtime.onclick=function(event){
            if(!event.shiftKey){
                window.location.href=
                    'https://blog.ameba.jp/ucs/analysis/analysis.do?unit=today'; }
            else{
                window.location.href=
                    'https://blog.ameba.jp/ucs/analysis/analysis_page.do?unit=today'; }}

        document.onkeydown=function(event){
            if(event.shiftKey){
                realtime.classList.add('shift'); }}

        document.onkeyup=function(event){
            if(!event.shiftKey){
                realtime.classList.remove('shift'); }}


        let style_icon=
            '<div class="bar_g">'+
            '<style>'+
            '.bar_g { position: absolute; top: 14px; right: 15px; width: 14px; height: 110px; '+
            'border: 1px solid #bbb; } '+
            '.bar_g:before { content: "前日"; display: block; font-size: 12px; line-height: 0; '+
            'margin: 30px 0 0; border-top: 1px solid #bbb; text-indent: -27px; } '+
            '.accessAnalysis__dailyAccess { position: relative; outline-offset: -1px; } '+
            '.accessAnalysis__dailyAccess:before { position: absolute; top: 2px; left: 12px; '+
            'font-family: ameba-symbols; font-size: 32px; '+
            'content: "\\EA57"; color: #2196f3; } '+
            '.accessAnalysis__dailyAccess.shift:after { content: "記事別"; '+
            'position: absolute; top: 43px; left: 16px; font: bold 16px Meiryo; } '+
            '.accessAnalysis__dailyAccess:hover { outline: 1px solid #2196f3; } '+
            '.realtimeAccess__header .spui-LinkButton--neutral { display: none; } '+
            '#contents .accessAnalysis__summary { background: #e2eef4; } '+
            '#contents .accessAnalysis__graph { background: #e2eef4; } '+
            '</style>';

        realtime.insertAdjacentHTML('beforeend', style_icon); }


    let access_ghtitle=document.querySelector('.accessAnalysis__graphHeadingTitle h3');
    if(access_ghtitle){
        let mag=
            '<input class="gh_mag" type="number" min="100" max="1000" step="10" value="100">'+
            '<style>'+
            '#contents .accessAnalysis__graphDrawingArea { '+
            'margin-top: 6px; overflow: hidden; position: relative; } '+
            '.recharts-responsive-container { position: absolute; bottom: 0; } '+
            '.gh_mag { width: 50px; text-align: center; padding: 2px 0 1px; '+
            'margin: -10px 20px; vertical-align: -5px; opacity: 0; } '+
            '.gh_mag::-webkit-inner-spin-button { height: 16px; margin-top: 0; } '+
            '.accessAnalysis__graphHeading:hover .gh_mag { opacity: 1; }'+
            '</style>';

        access_ghtitle.insertAdjacentHTML('beforeend', mag); }


    setTimeout(()=>{
        graph_mag();
    }, 500); // ページを開いてからのタイミング

    setTimeout(()=>{
        new_report1();
        new_report_rank1();
    }, 500); // ページを開いてからのタイミング

    setTimeout(()=>{
        counter_bar();
    }, 2000);

} // 管理トップ で実行



function counter_bar(){
    let Counter=document.querySelector('.c-numberCounter');
    let Gap=document.querySelector('.accessAnalysis__dailyAccessGapNumber');
    if(Counter && Gap){
        let c=Counter.textContent;
        if(c){
            c=parseInt(c.replace(/,/g, ''), 10); }
        let g=Gap.textContent;
        if(g){
            if(g=='±0'){ //「±」がNaN処理されるのを回避
                g=0; }
            else{
                g=parseInt(g.replace(/,/g, ''), 10); }}

        let bar_css;
        if(c-g!=0){
            let bar_height=Math.round(80*c/(c-g));
            bar_css='.bar_g { box-shadow: inset 0 -'+ bar_height +'px #35c6d6; }'; }
        else{ // 前日のカウント0の場合
            bar_css='.bar_g { box-shadow: inset 0 -110px #eee; }'; }

        let bar_style=
            '<style class="bar_style">'+ bar_css +'</style>';

        if(document.querySelector('.bar_style')){
            document.querySelector('.bar_style').remove(); }
        document.body.insertAdjacentHTML('beforeend', bar_style); }

} // counter_bar()



function graph_mag(){
    let mag; // グラフの縦拡大率
    mag=get_cookie('Awake_gh_mag');
    if(mag==0){
        mag=100;
        document.cookie='Awake_gh_mag='+ mag +'; Max-Age=2592000'; } // 30日

    let gh_mag=document.querySelector('.gh_mag');
    let graph=document.querySelector('.recharts-responsive-container');
    if(gh_mag && graph){
        gh_mag.value=mag;
        graph.style.height=mag+'%';

        gh_mag.oninput=function(){
            mag=gh_mag.value;
            graph.style.height=mag+'%';
            document.cookie='Awake_gh_mag='+ mag +'; Max-Age=2592000'; }}

    function get_cookie(name){
        let cookie_req=document.cookie.split('; ').find(row=>row.startsWith(name));
        if(cookie_req){
            if(cookie_req.split('=')[1]==null){
                return 0; }
            else{
                return cookie_req.split('=')[1]; }}
        if(!cookie_req){
            return 0; }}

} // graph_mag()




if(path.includes('analysis')){ // アクセス解析全体
    let target0=document.querySelector('#root > div');
    let monitor0=new MutationObserver(page_change);
    monitor0.observe(target0, { childList: true });

    page_change();

    function page_change(){
        let path=location.pathname;
        let search=location.search;

        set_selectday();
        breadcrumb_top();

        if(path.includes('analysis.do')){ // アクセス解析トップ
            clear_page_count();
            setTimeout(()=>{
                new_report2();
                new_report_rank2();
            }, 500); // ページを開いてからのタイミング


            let realtime=document.querySelector('.p-realtimeAccess');
            if(realtime){
                realtime.style.cursor='pointer';
                realtime.onclick=function(event){
                    if(!event.shiftKey){
                        window.location.href='https://blog.ameba.jp/ucs/top.do'; }
                    else{
                        window.location.href=
                            'https://blog.ameba.jp/ucs/analysis/analysis_page.do?unit=today'; }}

                document.onkeydown=function(event){
                    if(event.shiftKey){
                        realtime.classList.add('shift'); }}

                document.onkeyup=function(event){
                    if(!event.shiftKey){
                        realtime.classList.remove('shift'); }}

                let style_icon=
                    '<style>.p-realtimeAccess { position: relative; } '+
                    '.p-realtimeAccess:before { position: absolute; left: 10px; '+
                    'font-family: ameba-symbols; font-size: 32px; '+
                    'content: "\\EA31"; color: #009688; } '+
                    '.p-realtimeAccess.shift:before { content: "\\EA57"; color: #2196f3; } '+
                    '.p-realtimeAccess.shift:after { content: "記事別"; '+
                    'position: absolute; top: 40px; left: 14px; font: bold 16px Meiryo; } '+
                    '.p-realtimeAccess:hover { border-color: #2196f3; } '+
                    '.p-analysisSummary { background: #e2eef4; }'+
                    '.p-genreRanking { background: #e2eef4; }'+
                    '.p-genreRanking__graph { background: #ffffff75 }'+
                    '</style>'+
                    '<style>.p-analysisSummary__ranking__rank { '+
                    'margin-left: 20px; padding: 0 30px; width: fit-content; height: 32px; }'+
                    '</style>';

                realtime.insertAdjacentHTML('afterbegin', style_icon); }


            setTimeout(()=>{
                let more=document.querySelector(
                    '.p-accessGraph__1Column .p-accessGraph__moreLinkBtn');
                if(more){
                    more.innerHTML=
                        '記事別：　アクセス数が多い記事'+
                        '<i aria-hidden="true" class="p-accessGraph__linkIcon s s-triangle-right"></i>'; }
            },200);

        } // アクセス解析トップ



        if(path.includes('analysis_page.do')){ // アクセス数が多い記事
            setTimeout(()=>{
                let target1=document.querySelector('#root section');
                let monitor1=new MutationObserver(analysis_page_set);
                monitor1.observe(target1, { childList: true });

                analysis_page_set();

                function analysis_page_set(){
                    open_entry();

                    if(search.includes('unit=today')){ //「今日」のデータを開いた時に限る
                        today_page_count(); }

                    if(search.includes('order=organic_click_desc')){ //「検索流入が多い記事」のみ
                        order_page_set(); }}

            }, 400);

        } // アクセス数が多い記事



        if(path.includes('analysis_page_detail.do')){ // 検索パフォーマンス・検索キーワード
            clear_page_count();

        } // 検索パフォーマンス・検索キーワード

    } // page_change()

} // アクセス解析全体



function set_selectday(){
    setTimeout(()=>{
        let target2=document.querySelector('.c-radioSelect');
        if(target2){
            check();
            let monitor2=new MutationObserver(check);
            monitor2.observe(target2, { subtree: true, characterData: true }); }

        function check(){
            let select=target2.querySelector('.c-radioSelect__button');
            if(select.textContent=='今日'){
                select.style.outlineOffset='';
                select.style.outline=''; }
            else if(select.textContent=='-' || select.textContent=='昨日'){
                select.style.outlineOffset='-1px';
                select.style.outline='1px solid #2196f3'; }
            else{
                select.style.outlineOffset='-1px';
                select.style.outline='2px solid #2196f3'; }}
    }, 400);

} // set_selectday()



function breadcrumb_top(){
    setTimeout(()=>{
        let breadc=document.querySelector('.spui-Breadcrumb');
        if(breadc){
            let top=breadc.querySelector('.spui-Breadcrumb-item a');
            if(top){
                let link=top.getAttribute('href');
                if(link=='/ucs/analysis/analysis.do'){
                    top.setAttribute('href', '/ucs/analysis/analysis.do?unit=today'); }}}
    }, 400);

} // breadcrumb_top()



function new_report1(){
    let graph_term=document.querySelector('.accessAnalysis__graphHeadingTerm');
    if(graph_term){
        let accsess_text=graph_term.textContent.split('〜')[1];
        let day=accsess_text.slice(0, -3).split('/')[1];

        let date=new Date();
        date.setDate(date.getDate() -1); // 昨日の日付を取得
        let yesterday=date.getDate();
        if(day==yesterday){
            let access_panel=document.querySelector('.accessAnalysis__summary');
            let access_graph=document.querySelector('.accessAnalysis__graph');
            if(access_panel && access_graph){
                access_panel.style.background='#fff';
                access_graph.style.background='#fff'; }}}

} // new_report1()



function new_report_rank1(){
    if(get_cookie('Awake_updated')==1){ // Cookie 「updated」をチェック Age 2h 🟢
        disp_updated(); } // 更新後の2hはハイライト表示

    let compare='';
    let GRnum=
        document.querySelector('.accessAnalysis__summaryRankingGenreRelatedRankNumber');
    if(GRnum){
        compare+=GRnum.textContent; }
    let GAnum=
        document.querySelector('.accessAnalysis__summaryRankingGenreAllRankNumber');
    if(GAnum){
        compare+=GAnum.textContent; }


    // 以下のチェックを起動ごとに行う
    let last=get_cookie('Awake_last');
    if(last!=0 && compare!=''){
        if(last!=compare){ // 更新後の判定　Cookie 「updated」を登録 Age 2h 🟢
            document.cookie='Awake_updated=1; Max-Age=7200';
            disp_updated(); }}
    else{ ; } // 22h以内に管理トップを開いていない or compare取得に失敗した　判定不能


    if(compare!=''){ // 起動ごとに Cookie「Awake_last」を更新 Age 22h 🟢
        document.cookie='Awake_last='+compare+'; Max-Age=79200'; }


    function disp_updated(){
        let panel_G=document.querySelector('.accessAnalysis__summaryRankingGenre');
        if(panel_G){
            panel_G.style.filter='hue-rotate(45deg)';
            panel_G.style.background='#fff'; }}


    function get_cookie(name){
        let cookie_req=document.cookie.split('; ').find(row=>row.startsWith(name));
        if(cookie_req){
            if(cookie_req.split('=')[1]==null){
                return 0; }
            else{
                return cookie_req.split('=')[1]; }}
        if(!cookie_req){
            return 0; }}

} // new_report_rank1()



function new_report2(){
    let access_title=document.querySelector('.p-analysisSummary__access__title');
    if(access_title){
        let accsess_text=access_title.textContent.match(/\(.*\)/).toString();
        let day=accsess_text.match(/\/.*/).toString().replace(/[^0-9]/g, '');

        let date=new Date();
        date.setDate(date.getDate() -1); // 昨日の日付を取得
        let yesterday=date.getDate();

        if(day==yesterday){
            let access_panel=document.querySelector('.p-analysisSummary');
            access_panel.style.background='#fff'; }}

} // new_report2()



function new_report_rank2(){
    let genre_xscale=document.querySelectorAll('.p-genreRanking__xScale');
    if(genre_xscale.length==7){

        let xscale_text=genre_xscale[6].textContent.match(/\/.*\(/).toString();
        let day=xscale_text.replace(/[^0-9]/g, '');

        let date=new Date();
        date.setDate(date.getDate() -1); // 昨日の日付を取得
        let yesterday=date.getDate();

        let access_graph=document.querySelector('.p-genreRanking');
        let ranking_rank=document.querySelectorAll('.p-analysisSummary__ranking__rank');
        if(day==yesterday){
            if(access_graph){
                access_graph.style.background='#fff'; }
            if(ranking_rank[0]){
                ranking_rank[0].style.background='#fff'; }
            if(ranking_rank[1]){
                ranking_rank[1].style.background='#fff'; }}}

} // new_report_rank2()



function today_page_count(){
    clear_page_count();

    let retry=0;
    let interval=setInterval(more_open, 1000);
    function more_open(){
        retry++;
        if(retry>20){ // リトライ制限 20回 4sec
            clearInterval(interval);
            alert("全てのリスト情報を開かずに合計しました"); }

        let more=document.querySelector('.p-accessGraph__moreLinkBtn--center');
        if(more){
            more.click(); }
        if(!more){
            clearInterval(interval);
            today_only(); }}


    function today_only(){
        if(location.search.includes('unit=today')){
            page_count(); }}


    function page_count(){
        let line_count=0;
        let num_count=0;
        let p_count=document.querySelectorAll('.p-accessAnalysisGraphListItem__count');
        for(let k=0; k<p_count.length; k++){
            line_count+=1;
            let line_item_disp=p_count[k].textContent.replace(/[^0-9]/g, '');
            num_count+=parseInt(line_item_disp, 10); }

        let disp=
            '<div id="add_access">'+
            '参照された記事数：'+ line_count +'　アクセス数合計：'+ num_count +
            '<style>'+
            '#add_access { position: absolute; top: 58px; right: 32px; '+
            'padding: 4px 15px 2px; font: normal 16px Meiryo; z-index: 10; '+
            'border: 1px solid #009688; background: #fff; '+
            'box-shadow: 2px 3px 6px rgb(170, 170, 170,  0.4); }';
        if(line_count==100){
            disp+=
                '#add_access { border: 1px solid red; }'; }
        disp+='</style></div>';

        if(document.querySelector('#add_access')){
            document.querySelector('#add_access').remove(); }
        let ucsContent=document.querySelector('#ucsContent');
        if(ucsContent && line_count>0){
            ucsContent.insertAdjacentHTML('beforeend', disp); }

        let add_access=document.querySelector('#add_access');
        window.addEventListener("scroll", scroll);
        function scroll(){
            let scroll_position=window.pageYOffset;
            if(add_access){
                if(scroll_position>100){
                    add_access.style.top=(scroll_position - 42)+'px'; }
                else{
                    add_access.style.top='58px'; }}}

    } // page_count()

} // today_page_count()



function clear_page_count(){
    if(document.querySelector('#add_access')){
        document.querySelector('#add_access').remove(); }}



function order_page_set(){
    let more=document.querySelector('.p-accessGraph__moreLinkBtn--center');
    if(more){
        more.click();
        setTimeout(()=>{
            more.click(); }, 600); }


    let returnB=document.querySelector('.c-returnButton');
    if(returnB){
        returnB.setAttribute('href', '/ucs/analysis/analysis.do?unit=today');
        returnB.onclick=()=>{
            location.href='/ucs/analysis/analysis.do?unit=today'; }}


    document.oncontextmenu=function(event){
        if(!event.shiftKey && !event.ctrlKey){ //「+Ctrl」「+Shift」で通常の右クリック操作
            let elem=document.elementFromPoint(event.clientX, event.clientY);
            let link_elem=elem.closest('a');
            if(link_elem.classList.contains('_1ulb2')){
                event.preventDefault();
                clear_set();
                link_elem.style.outline='1px solid #2196f3';
                link_elem.style.outlineOffset='-1px'; }}}


    document.onmousedown=function(event){
        clear_set();
        let links=document.querySelectorAll('._1ulb2');
        for(let k=0; k<links.length; k++){
            links[k].onclick=function(event){
                event.preventDefault();
                let link=links[k].getAttribute('href');
                window.open(link, '_blank'); // 別タブで開く
                links[k].style.outline='1px solid #2196f3';
                links[k].style.outlineOffset='-1px'; }}}


    function clear_set(){
        let links=document.querySelectorAll('._1ulb2');
        for(let k=0; k<links.length; k++){
            links[k].style.outline='';
            links[k].style.outlineOffset=''; }}

} // order_page_set()



function open_entry(){
    document.addEventListener('mousedown', function(event){
        if(event.shiftKey){ //「Shift+Click」
            all_item_bar(0);
            to_entry(event); }});

    document.addEventListener('keydown', function(event){
        if(event.shiftKey){
            all_item_bar(1); }});

    document.addEventListener('keyup', function(event){
        if(!event.shiftKey){
            all_item_bar(0); }});


    function to_entry(event){
        let elem=document.elementFromPoint(event.clientX, event.clientY);
        if(elem){
            let link=elem.closest('.p-accessAnalysisGraphListItem__link');
            if(link){
                event.preventDefault();
                event.stopImmediatePropagation();
                let link_href=link.getAttribute('href');
                if(link_href){
                    let index=link_href.indexOf('id=');
                    let entry_id=link_href.substring(index+3, index+14);

                    let user_id;
                    let user=document.querySelector('.amebaId');
                    if(user){
                        user_id=user.textContent; }

                    if(entry_id && user_id){
                        let entry_url='https://ameblo.jp/'+ user_id +'/entry-'+ entry_id +'.html';
                        window.open(entry_url); }
                }}}

    } // to_entry(event)


    function all_item_bar(n){
        let paG=document.querySelector('.p-accessGraph__graph');
        if(paG){
            if(n==0){
                paG.style.boxShadow=''; }
            else{
                paG.style.boxShadow='-17px 0 0 -9px #cfd8dc'; }}

    } // all_item_bar(n)

} // open_entry()
