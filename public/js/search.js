$(function () {
   //alert("Hello!");
   
   $('#searchBtn').click(function(){
       var keyword = $('#keyword').val();
       var sinceYmd = $('#sinceYmd').val();
       var untilYmd = $('#untilYmd').val();
       $.ajax({
          type: "GET",
          url:"/search.json",
          data: {
              keyword: keyword,
              sinceYmd: sinceYmd,
              untilYmd: untilYmd
          },
          success:function(data){
              myProc(data);
          }
      });
      return false;
   });
   
   function myProc(result) {
       //console.dir(result);
       // テンプレート読み込み     
       var myTemplate = Hogan.compile($('#tmpl').html());
        var template = myTemplate.render(result);
        $('#out').html(template);
   }
});