/*<![CDATA[*/
var ctxPath = /*[[@{/}]]*/ '';

var $ = jQuery,
    $list = $('#thelist'),
    $btn = $('#ctlBtn'),
    state = 'pending',
    uploader;
var fileMd5;//文件的MD5值
var fileName;//文件名称
var blockSize = 10 * 1024 * 1024;
var md5Arr = new Array(); //文件MD5数组
var timeArr = new Array();//文件上传时间戳数组
WebUploader.Uploader.register({
    "before-send-file": "beforeSendFile",//整个文件上传前
    "before-send": "beforeSend",//每个分片上传前
    "after-send-file": "afterSendFile"//分片上传完毕
}, {
    //1.生成整个文件的MD5值
    beforeSendFile: function (file) {
        var index = file.id.slice(8);//文件下标
        var startTime = new Date();//一个文件上传初始化时，开始计时
        timeArr[index] = startTime;//将每一个文件初始化时的时间放入时间数组
        var deferred = WebUploader.Deferred();
        //计算文件的唯一标记fileMd5，用于断点续传  如果.md5File(file)方法里只写一个file参数则计算MD5值会很慢 所以加了后面的参数：10*1024*1024
        (new WebUploader.Uploader())
            .md5File(file, 0, blockSize)
            .progress(function (percentage) {
                $('#' + file.id).find('p.state').text('正在读取文件信息...');
            })
            .then(function (value) {
                $("#" + file.id).find('p.state').text('成功获取文件信息...');
                fileMd5 = value;
                var index = file.id.slice(8);
                md5Arr[index] = fileMd5;//将文件的MD5值放入数组，以便分片合并时能够取到当前文件对应的MD5
                uploader.options.formData.guid = fileMd5;//全局的MD5
                deferred.resolve();
            });
        fileName = file.name;
        return deferred.promise();
    },
    //2.如果有分快上传，则每个分块上传前调用此函数
    beforeSend: function (block) {
        var deferred = WebUploader.Deferred();
        $.ajax({
            type: "POST",
            url: "/upload/checkblock", //ajax验证每一个分片
            data: {
                //fileName: fileName,
                //fileMd5: fileMd5, //文件唯一标记
                chunk: block.chunk, //当前分块下标
                chunkSize: block.end - block.start,//当前分块大小
                guid: uploader.options.formData.guid,
            },
            cache: false,
            async: false, // 与js同步
            timeout: 1000, // 超时的话，只能认为该分片未上传过
            dataType: "json",
            success: function (response) {
                if (response.ifExist) {
                    //分块存在，跳过
                    deferred.reject();
                } else {
                    //分块不存在或不完整，重新发送该分块内容
                    deferred.resolve();
                }
            }
        });
        this.owner.options.formData.fileMd5 = fileMd5;
        deferred.resolve();
        return deferred.promise();
    },
    //3.当前所有的分块上传成功后调用此函数
    afterSendFile: function (file) {
        //如果分块全部上传成功，则通知后台合并分块
        var index = file.id.slice(8);//获取文件的下标
        $('#' + file.id).find('p.state').text('上传成功');
        $.post('/upload/combine', {"guid": md5Arr[index], fileName: file.name},
            function (data) {
            }, "json");
    }
});

//上传方法
uploader = WebUploader.create({
    auto: true,// 选完文件后，是否自动上传。
    // swf文件路径
    swf: '@{assets/webuploader/Uploader.swf}',
    // 文件接收服务端。
    server: '/upload/save',
    // 选择文件的按钮。可选。
    // 内部根据当前运行是创建，可能是input元素，也可能是flash.
    dnd: '#upload-file-container',
    pick: '#picker',
    chunked: true, //分片处理
    chunkSize: 10 * 1024 * 1024, //每片5M
    threads: 3,//上传并发数。允许同时最大上传进程数。
    // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
    resize: false,
    formData: {
        folderId: 1
    },
    fileSizeLimit: 1024*1024*100*100, //验证文件总大小是否超出限制, 超出则不允许加入队列。
    fileSingleSizeLimit: 1024*1024*100, //验证单个文件大小是否超出限制, 超出则不允许加入队列。
});
uploader.options.formData.folderId = 1;
uploader.on( 'uploadBeforeSend', function( block, data ) {
    // 修改data可以控制发送哪些携带数据。
    data.folderId = getFolderId();
});
// 当有文件被添加进队列的时候
uploader.on('fileQueued', function (file) {
    //文件列表添加文件页面样式
    $('#upload-file-container').css("display","none");
    $('#hasfile').removeClass("hider");
    $('#hasfileBtn').css("display","");
    var fileName = file.name + "- " + getfilesize(file.size);
    if (fileName.length >= 25) {
        fileName = file.name.substring(0, 8);
        fileName = fileName + '...' + file.name.substring( file.name.length - 8,file.name.length);
    }
    $list.append('<li id="' + file.id + '" aid="1" cid="0" complete="1" success="1" style="display: flex;"><i class="hint-icon hint-suc-s" rel="ico"></i>\n' +
        '                                <span class="file-name" title="' + file.name + '">' + fileName + ' <i\n' +
        '                                        rel="size_str">- ' + getfilesize(file.size) + '</i></span>\n' +
        '                                <span class="file-status" rel="status" style="font-size: 14px;width: 250px;">\n' +
        '                                   <div style="display: flex;"><p class="state" style="margin-left: 50px;">等待上传...</p><span class="time" style="margin-left: 50px;"></span></div>\n' +
        '                               </span>\n' +
        '                               <em rel="op" style="width: 50px;">' +
        '                                   <a href="javascript:;" class="ico-opt ico-remove" style="margin-left:5px;">删除</a>' +
        '                               </em>' +
        '                               <b rel="progress" style="width: 0%;"></b>' +
        '                            </li>');
});
// 文件上传过程中创建进度条实时显示
uploader.on('uploadProgress', function (file, percentage) {
    //计算每个分块上传完后还需多少时间
    var index = file.id.slice(8);//文件的下标
    var currentTime = new Date();
    var timeDiff = currentTime.getTime() - timeArr[index].getTime();//获取已用多少时间
    var timeStr;
    //如果percentage==1说明已经全部上传完毕，则需更改页面显示
    if (1 == percentage) {
        timeStr = "耗时：" + countTime(timeDiff);//计算总用时
    } else {
        timeStr = "预计需要：" + countTime(timeDiff / percentage * (1 - percentage));//估算剩余用时
    }
    //创建进度条
    var $li = $('#' + file.id), $percent = $li.find('b');
    // 避免重复创建
    if (!$percent.length) {
        $percent = $(
            '<b rel="progress" style="width: 0%;"></b>')
            .appendTo($li).find('.progress-bar');
    }
    $li.find('p.state').text('上传中');
    $li.find('span.time').text(timeStr);
    $percent.css('width', percentage * 100 + '%');
});
/*    uploader.on('uploadSuccess', function (file) {
        var index = file.id.slice(8);
        $('#' + file.id).find('p.state').text('已上传');
        $.post(/!*[[@{/upload/combine}]]*!/, {
            "guid": md5Arr[index],
            fileName: file.name,
        }, function () {
            uploader.removeFile(file);
        }, "json");
    });*/

//上传失败时
uploader.on('uploadError', function (file) {
    $('#' + file.id).find('p.state').text('上传出错');
});
//上传完成时
uploader.on('uploadComplete', function (file) {
    listFile(getFolderId())
    $('#' + file.id).find('.progress').fadeOut();
});
//上传状态
uploader.on('all', function (type) {
    if (type === 'startUpload') {
        state = 'uploading';
    } else if (type === 'stopUpload') {
        state = 'paused';
    } else if (type === 'uploadFinished') {
        state = 'done';
    }
    if (state === 'uploading') {
        $btn.text('暂停上传');
    } else {
        $btn.text('开始上传');
    }
});
//开始、暂停上传的函数
$btn.on('click', function () {
    //每个文件的删除按钮不可用
    $(".delbtn").attr("disabled", true);
    if (state === 'uploading') {
        uploader.stop(true);//暂停
        //删除按钮可用
        $(".delbtn").removeAttr("disabled");
    } else {
        uploader.upload();
    }
});

/**
 * 从上传队列中删除
 */
$('#upload-list').on('click', '.upload-item .btn-delete', function() {
    // 从文件队列中删除某个文件id
    file_id = $(this).data('file_id');
    // uploader.removeFile(file_id); // 标记文件状态为已取消
    uploader.removeFile(file_id, true); // 从queue中删除
    console.log(uploader.getFiles());
});

/**
 * 重新尝试上传
 */
$('#upload-list').on('click', '.btn-retry', function() {
    uploader.retry($(this).data('file_id'));
});

//获取上传时还需多少时间
function countTime(date) {
    var str = "";
    //计算出相差天数
    var days = Math.floor(date / (24 * 3600 * 1000))
    if (days > 0) {
        str += days + " 天 ";
    }
    //计算出小时数
    var leave1 = date % (24 * 3600 * 1000) //计算天数后剩余的毫秒数
    var hours = Math.floor(leave1 / (3600 * 1000))
    if (hours > 0) {
        str += hours + " 小时 ";
    }
    //计算相差分钟数
    var leave2 = leave1 % (3600 * 1000) //计算小时数后剩余的毫秒数
    var minutes = Math.floor(leave2 / (60 * 1000))
    if (minutes > 0) {
        str += minutes + " 分 ";
    }
    //计算相差秒数
    var leave3 = leave2 % (60 * 1000) //计算分钟数后剩余的毫秒数
    var seconds = Math.round(leave3 / 1000)
    if (seconds > 0) {
        str += seconds + " 秒 ";
    } else {
        /* str += parseInt(date) + " 毫秒"; */
        str += " < 1 秒";
    }
    return str;
}

//删除文件
function delFile(fileName) {
    if (confirm("确定删除？")) {
        $.ajax({
            type: "GET",
            url: '/upload/delFile',
            data: {
                "fileName": fileName
            },
            async: true,
            dataType: "json",
            success: function (data) {
                if ("true" == data.result) {
                    alert("删除成功！");
                } else {
                    alert("删除失败！");
                }
            }
        });
        setTimeout(function () {
            $("#btn_refesh").click()
        }, 1000);
    }
}

// $('#upload-file-container').click(function(event) {
//     $('#upload-file-container').find('input').click()
// });

function getFolderId(){
    let jQuery = $(".breadcrumb").children().last().prev();
    let folderId = $(jQuery).data("id");
    return folderId;
}

/*]]>*/