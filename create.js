define(['PrimecloudPaas', 'ZeroClipboard', 'async'], function (PrimecloudPaas, ZeroClipboard, async) {

    window['ZeroClipboard'] = ZeroClipboard;
    var model = avalon.define({
        $id: 'createCourse',

        //pass接口
        url: "",  //http://214.sgld.org:13289/Resource/Upload?uid=622d008d63194e78af6e0783c14b0875

        // 提交data
        postInfo: {
            courseId: '',
            baseInfo: {
                teacherId: '',
                courseTitle: ''
            },
            prelearnInfo: [
                {
                    title: '课前导学',
                    courseId: '',
                    nodeIds: [],
                    dataIds: [],
                    nodeInfo: [
                        {
                            sort: 0,
                            title: '',
                            dataInfo: [],
                            isFree: 0,
                            detailTitle: ''
                        }
                    ]
                }
            ]
        },

        //小节排序
        sortShow: function () {
            $(this).children().show();
        },
        sortHide: function () {
            $(this).children().hide();
        },

        //向上移动
        sectionUp: function (arr, index, outerindex) {
            if (index != 0) {
                var sec1 = arr[index];
                var sec2 = arr[index - 1];
                arr.splice(index - 1, 1, sec1);
                arr.splice(index, 1, sec2);
            }
            model.postInfo.prelearnInfo[outerindex].nodeInfo = arr;
        },

        //向下移动
        sectionDown: function (arr, index, outerindex) {
            if (index != arr.length - 1) {
                var sec1 = arr[index];
                var sec2 = arr[index + 1];
                arr.splice(index + 1, 1, sec1);
                arr.splice(index, 1, sec2);
            }
            model.postInfo.prelearnInfo[outerindex].nodeInfo = arr;
        },

        //小节的排序字段赋值
        sortFun: function(){
            for (var i = 0; i < model.postInfo.prelearnInfo.length; i++) {
                for (var j = 0; j < model.postInfo.prelearnInfo[i].nodeInfo.length; j++) {
                    model.postInfo.prelearnInfo[i].nodeInfo[j].sort = j + 1;
                    //console.log(model.postInfo.prelearnInfo[i].nodeInfo[j].sort);
                }
            }
        },

        //添加章节
        addchapter: function (type, index) {
            switch (type) {
                case 2:
                    $(this).parent().siblings('.courseopen').removeClass('hide');
                    $(this).parent().parent().children('.content_right_newcourse_create_con_bar').children('.content_right_newcourse_create_con_bar_img').removeClass('down').addClass('up');
                    model.postInfo.prelearnInfo[index].nodeInfo.push(
                        {
                            sort: 0,
                            title: '',
                            dataInfo: [],
                            isFree: 0,
                            detailTitle: ''
                        }
                    );
                    console.log(model.postInfo);
                    break;
            }
        },

        //文件大小计算
        countsize: function (dataname, datasize) {
            if (datasize > 1024 * 1024 * 1024) {
                return false;
            } else {
                return true;
            }
        },

        //添加资料--添加文件信息到资料数组
        uploadziliao: function (data, datalength, chapterIndex, nodeIndex, typearr) {
            for (var i = 0; i < datalength; i++) {
                var title = data[i].name;
                var courseFormat = data[i].name.substring(data[i].name.lastIndexOf('.') + 1);
                var arrlastindex = typearr.push(
                    {
                        title: title,
                        courseFormat: courseFormat,
                        courseSize: 0,
                        fileID: '',
                        courseTime: 0,
                        convertype: 0,
                        videoType: 0,
                        showjdbar: false,       //进度条显示与隐藏
                        stopupload: false,      //是否点击取消上传
                        jdmsg: '',              //进度条提示信息
                        progressBara: '0',      //读取进度条
                        progressBarb: '0',      //上传进度条
                        isSuccess: 2            //默认转码中
                    }
                );
                var nowIndex = nodeIndex;
                // if()
                model.fordataupload(data[i], typearr[arrlastindex - 1], arrlastindex - 1, nowIndex);
            }
            //上传文件第一个文件名赋值
            if (!model.postInfo.prelearnInfo[chapterIndex].nodeInfo[nodeIndex].title) {
                model.postInfo.prelearnInfo[chapterIndex].nodeInfo[nodeIndex].title = model.postInfo.prelearnInfo[chapterIndex].nodeInfo[nodeIndex].dataInfo[0].title.split('.')[0];
            }
        },

        //请求
        request: function (url, data, callback, ignoreFailed) {
            var method = 'POST';
            if (typeof data === 'function') {
                method = 'GET';
                ignoreFailed = callback;
                callback = data;
                data = null;
            }
            $.ajax({
                url: url,
                dataType: 'json',
                type: method,
                data: data,
                success: function (response) {
                    /*if (!response.type) {
                     if (!ignoreFailed) { return callback(new Error('暂无数据')); }
                     response = false;
                     }*/
                    return callback(null, response);
                },
                //error: callback
                error: function (error) {
                    console.log('网络异常，请重试');
                    alert('网络异常，请重试');
                }
            });
        },

        //循环创建新添加的上传对象，并执行上传
        videoType: 0,
        nodeIndex: 0,
        fordataupload: function (file, dataobj, dataindex, nodeIndex) {
            model.nodeIndex = nodeIndex;
            model.postInfo.prelearnInfo[0].nodeInfo[model.nodeIndex].dataInfo.file = file;
            model.postInfo.prelearnInfo[0].nodeInfo[model.nodeIndex].dataInfo.dataobj = dataobj;
            async.auto({
                step0: model.upload0,
                step1: ["step0", model.upload1],
                step4: ["step1", model.upload4]
            }, function(err, results){
                if(err){
                    console.log(err);
                    if(err == "fail"){
                        console.log(model.postInfo.prelearnInfo[0].nodeInfo[results.step0].dataInfo.file.name + ' 上传失败，请重试');
                        alert(model.postInfo.prelearnInfo[0].nodeInfo[results.step0].dataInfo.file.name + ' 上传失败，请重试');
                    }else if(err == "cancel"){
                        model.postInfo.prelearnInfo[0].nodeInfo[results.step0].dataInfo.dataobj.stopupload ? console.log('----------------------------------' + model.postInfo.prelearnInfo[0].nodeInfo[results.step0].dataInfo.file.name + '取消上传----------------------------------') : console.log('----------------------------------code:401----------------------------------');
                    }
                }
                //console.log(results);
            });
        },

        // 创客视频终止上传
        stopupload: function (nodeobj) {
            nodeobj.stopupload = true;
            nodeobj.showjdbar = false;
            nodeobj.jdmsg = '';
            nodeobj.progressBara = '0';
            nodeobj.progressBarb = '0';
            if (nodeobj.paas) {
                nodeobj.paas.endUpload();
                nodeobj.paas.endMD5();
                nodeobj.paas = null;
            }
        },

        //执行终止
        dostopupload: function (nodeobj, outoutindex, outindex, index) {
            if (!confirm('确定删除？')) {
                return false;
            }
            model.stopupload(nodeobj);
            model.postInfo.prelearnInfo[outoutindex].nodeInfo[outindex].dataInfo.splice(index, 1);//删除章节信息
            if (nodeobj.hasOwnProperty("id")) {
                // model.deletedatabase(2, nodeobj.id);
                model.postInfo.prelearnInfo[outoutindex].dataIds.push(nodeobj.id);
            }
        },

        // 创客章节删除
        delchapter: function (type, obj, outobj, outindex, index) {

            if (!confirm('确定删除？')) {
                return false;
            }
            setTimeout(function() {
                if (obj.dataInfo) {
                    $.each(obj.dataInfo, function () {
                        model.stopupload(this);//停止上传
                    });
                }
                if (type == 1) {
                    model.postInfo.prelearnInfo[outindex].nodeInfo.splice(index, 1);
                    //如果nodeInfo已删除干净，改变stack的类名为down
                    if (!model.postInfo.prelearnInfo[outindex].nodeInfo.length) {
                        $(this).parent().parent().parent().parent().siblings('.content_right_newcourse_create_con_bar').children('.content_right_newcourse_create_con_bar_img').removeClass('up').addClass('down');
                    }
                    if (obj.hasOwnProperty("id")) {
                        // model.deletedatabase(1, obj.id)
                        model.postInfo.prelearnInfo[outindex].nodeIds.push(obj.id);
                    }
                }
            }, 300)

        },

        //删除已添加信息
        deletedatabase: function (type, id) {
            if(! id) {
                alert("无法删除!");
                return false;
            }
            $.ajax({
                url: '/teacherCourse/deleteCourseChapter/' + type + '/' + id,
                type: 'GET',
                dataType: 'json',
                success: function (response) {
                    //
                }
            });
        },

        //上传分解0
        upload0: function (callback) {
            callback(null, model.nodeIndex);
        },

        //上传分解1
        upload1: function (data, callback) {
            model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.paas = new PrimecloudPaas();
            model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.paas.MD5(model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.file, function (result) {
                //判断是否 点击 取消上传
                if (model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.stopupload) {
                    console.log('----------------------------------' + model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.file.name + ' 取消上传 ----------------------------------');
                    //model.delpdataup(dataobj.dataindex); //从提交对象中删除这条取消的资料信息
                    return false;
                }
                if (result) {
                    model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.fileName = model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.paas.splitFileName(model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.file.name);
                    $('#md5container').val(result);
                    model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.fileMD5 = $('#md5container').val();
                    console.log('----------------------------------开始上传----------------------------------');
                    callback(null, result);
                } else {
                    callback("fail");
                }
            }, function (pos, size) {
                if (model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.stopupload) {
                    console.log('----------------------------------' + model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.file.name + ' 取消上传 ----------------------------------');
                    //model.delpdataup(model.dataobj.dataindex); //从提交对象中删除这条取消的资料信息
                    return false;
                }
                //显示进度条
                model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.showjdbar = true;
                //修改进度条进度提示信息
                var jd = parseInt(pos / size * 100);
                model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.progressBara = jd;
                if (jd == 100) {
                    model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.jdmsg = '上传中...';
                    console.log('----------------------------------' + model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.file.name + ': 扫描完成 ----------------------------------');
                }
            });
        },

        //上传分解4
        upload4: function(data, callback){
            var uploadData = {
                url: model.url,
                method: "POST",
                data: {
                    filedata: model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.file
                }
            };
            model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.paas.requestUpload(uploadData, function (e) {
                console.log(e);
                model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.progressBarb = parseInt(e.loaded / e.total * 100) ? parseInt(e.loaded / e.total * 100) : 0;
            }, function(e){
                console.log(e);
                if(model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.progressBarb == 100){
                    model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.showjdbar = false;
                    model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.jdmsg = '上传成功！';
                    model.postInfo.prelearnInfo[0].nodeInfo[data.step0].dataInfo.dataobj.fileID = 1;
                    console.log("上传成功！");
                    alert("上传成功！");
                }
            });
            callback();
        }

    });
    return model;
});
