define(['md5'], function(CryptoJS) {

	function PrimecloudPaas() {
		this.xhr = null;
		this.lock = false;
	}


	/**
     * 资源上传
     *
     * @paramter option		上传参数
     */
	PrimecloudPaas.prototype.requestUpload = function(option, progress, finish) {
	    function fn () {}
	    var async = option.async !== false;
	    var method = option.method.toUpperCase();
	    var data = option.data || null;
	    var success = option.success || fn;
	    var error = option.error || fn;
	    var url = option.url;
	    var form = new FormData();
        if (option.resume > 0) {
            form.append("file", data.filedata.slice(option.resume, data.filedata.size));
        } else {
            form.append("file", data.filedata);
        }
        this.xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
		this.xhr.upload.onprogress = progress;
        this.xhr.onprogress = finish;
        this.xhr.open(method, url, async);
        option.resume > 0 && this.xhr.setRequestHeader('Range', 'bytes='+ option.resume +'-');
        this.xhr.send(form);
	    return this.xhr;
	};


	/**
     * 获取文件MD5
     *
     * @paramter file 			文件域对象，例：document.getElementById("id").files[0];
     * @paramter callback 		扫描完成回调函数
     * @paramter progresback 	扫描进度回调函数
     */
	PrimecloudPaas.prototype.MD5 = function(inputFile, callback, progresback) {
        var type = CryptoJS.algo.MD5;
        var algoInst = {name: "MD5", instance:type.create()};
        this.progressiveRead(inputFile, function(data, pos, file){
            progresback(pos, file.size);
            var wordArray = PrimecloudPaas.prototype.arrayBufferToWordArray(data);
            algoInst.instance.update(wordArray);
        }, function (file){
            callback(algoInst.instance.finalize());
        });
	};


	/**
     * 读取进度
     *
     */
	PrimecloudPaas.prototype.progressiveRead = function(file, work, done) {
	    var chunkSize = 204800;
	    var pos = 0;
	    var reader = new FileReader();
		this.progress(chunkSize, pos, reader, file, work, done);
	};


	/**
     * 递归调用读取进度
     *
     */
	PrimecloudPaas.prototype.progress = function(chunkSize, pos, reader, file, work, done) {
		var that = this;
		var end = Math.min(pos + chunkSize, file.size);
        reader.onload = function (e) {
            pos = end;
            work(e.target.result, pos, file);
            if (pos < file.size) {
                that.lock || that.progress(chunkSize, pos, reader, file, work, done);
            } else {
                done(file);
            }
        }
        if (file.slice) {
            var blob = file.slice(pos, end);
        } else if (file.webkitSlice) {
            var blob = file.webkitSlice(pos, end);
        }
        reader.readAsArrayBuffer(blob);
	}


	/**
     * 获取32位字节码
     *
     */
	PrimecloudPaas.prototype.swapendian32 = function(val) {
	    return (((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF)) >>> 0;
	}


	/**
     * 将Buffer转换为数组
     *
     */
	PrimecloudPaas.prototype.arrayBufferToWordArray = function(arrayBuffer) {
	    var fullWords = Math.floor(arrayBuffer.byteLength / 4);
	    var bytesLeft = arrayBuffer.byteLength % 4;
	    var u32 = new Uint32Array(arrayBuffer, 0, fullWords);
	    var u8 = new Uint8Array(arrayBuffer);
	    var cp = [];
	    for (var i = 0; i < fullWords; ++i) {
	        cp.push(PrimecloudPaas.prototype.swapendian32(u32[i]));
	    }
	    if (bytesLeft) {
	        var pad = 0;
	        for (var i = bytesLeft; i > 0; --i) {
	            pad = pad << 8;
	            pad += u8[u8.byteLength - i];
	        }
	        for (var i = 0; i < 4 - bytesLeft; ++i) {
	            pad = pad << 8;
	        }
	        cp.push(pad);
	    }
	    return CryptoJS.lib.WordArray.create(cp, arrayBuffer.byteLength);
	};


	/**
     * 生成时间戳文件名
     *
     * @paramter fileName		上传文件域的文件名
     */
	PrimecloudPaas.prototype.splitFileName = function(fileName) {
		var str = fileName.substring(fileName.lastIndexOf("\\") + 1); 
		return new Date().getTime() +"."+ str.substring(str.lastIndexOf('.') + 1);
	}


	/**
     * 中断上传
     *
     */
	PrimecloudPaas.prototype.endUpload = function() {
		this.xhr && this.xhr.abort();
	}


	/**
     * 中断MD5
     *
     */
	PrimecloudPaas.prototype.endMD5 = function() {
		this.lock = true;
	}


	return PrimecloudPaas;

});