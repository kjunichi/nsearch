$(function () {
    // 現在のタブ一覧を保持する。
    var tablist=[];
    
    // タブが選択された場合の処理を更新？
    //
    $(document).on('click', 'a[data-toggle="tab"]', function (e) {
        var tabName = e.target.href;
        var listid = tabName.split("#")[1];
        $('#listid').val(listid);
    });
                
    $('#updateListBtn').click(function() {
       //
       var listid = $('#listid').val();
       $.ajax({
          type: "GET",
          url:"/list.json",
          data: {listid: listid}
        }).done(function(data){
            myProc(listid,data);
        }).fail(function(error){
            console.dir(error);
            alert("Oops!!" + error);
        });
    });
    
    //alert("bb");
    
    function myProc(listid,result) {
        // listidに該当するタブが無い場合、新規にタブを作る
        if(isNewTab(listid)) {
            // 新規でタブを作成する。
            $('#listidTabs').append("<li><a href=\"#"+listid+"\" data-toggle=\"tab\">"+listid+"</a></li>");
            $('#listStatsTab').append("<div class=\"tab-pane\" id=\""
                                    + listid
                                    +"\">"+listid+"</div>");
                                    
                //
　　

            tablist.push(listid);
        }
        
        //console.dir(result);
        // テンプレート読み込み     
        var myTemplate = Hogan.compile($('#tmpl').html());
        var template = myTemplate.render({statuses:result});
       
        // listidに対応したタブに出力する
        $('#'+listid).html(template);
        
        // listidに対応するタブをアクティブにする。
        $('#listidTabs a[href="#'+listid+'"]').tab('show');
        
    }
    
    //
    // 指定されたlistidが何番目のタブかを返す
    //
    function getTabNum(listid) {
        for(var i=0;i<tablist.length;i++) {
            if(tablist[i]===listid) {
                return i;
            }
        }
        return -1;
    }
    
    //
    // 指定されたlistidに対応するタブがあるかをチェック
    //
    function isNewTab(listid) {
        for(var i=0; i < tablist.length; i++) {
            if(tablist[i]===listid) {
                // 既にタブ作成済みの場合、falseを返す。
                return false;
            }
        }
        // 作成済みのタブが無かった場合、trueを返す。
        return true;
    }
});