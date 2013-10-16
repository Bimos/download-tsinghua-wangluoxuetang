/*
 * 李天阳 2013
 * ty@li-tianyang.com
 */

Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://modules/WLXTUtils.jsm");

if ("undefined" == typeof (WLXT)) {
    var WLXT = {
    };
};

WLXT.BrowserOverlay = {

    seekHelp : function(aEvent) {
        window.openDialog("chrome://wangluoxuetang/content/seekHelp.xul", "wlxt-seek-help", "chrome,centerscreen");
    },

    feedback : function(aEvent) {
        window.openDialog("chrome://wangluoxuetang/content/feedback.xul", "wlxt-feedback", "chrome,centerscreen");
    },

    startDownload : function(aEvent) {
        WLXT.DownloadData.openLearn();
    }
};

WLXT.DownloadData = {
    /*
    * TODO: use some better $strWindowFeatures?
    */
    //strWindowFeatures : "location=no",//XXX:
    strWindowFeatures : "",

    /*
     * stores each class's information
     */
    ClassDatum : function() {
        this.id = "";
        this.name = "";
    },

    escapeRegExp : function(string) {
        /*
         * taken from:
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
         */
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    },
};

WLXT.DownloadData.getClassNameURL = function(classRow) {
    var classDatum = new WLXT.DownloadData.ClassDatum();
    var classLink = classRow.getElementsByTagName("a")[0];
    /*
     * TODO: this might change over the years
     *
     * http://learn.tsinghua.edu.cn/MultiLanguage/lesson/student/course_locate.jsp?course_id=${id}
     */
    var getIDFromURLRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/lesson\/student\/course_locate\.jsp\?course_id\=(\d+)/;
    classDatum.id = getIDFromURLRegex.exec(classLink.href).pop();
    classDatum.name = classLink.innerHTML.trim();
    return classDatum;
};

WLXT.DownloadData.PageType = {
    /*
     * ordered according to @WLXT.DownloadData.downloadClass
     */
    NOTE_ID : 0,
    COURSE_INFO : 1,
    DOWNLOAD : 2,
    WARE_LIST : 3,
    HOM_WK_BRW : 4,
    BBS_ID_STUDENT : 5,
    TALKID_STUDENT : 6,
    DISCUSS_MAIN : 7,

    /*
     * 课程公告
     */
    NOTE_REPLY : 8,
};

WLXT.DownloadData.downloadClass = function(classDatum) {
    WLXTUtils.dlHelper[classDatum.id] = new WLXTUtils.ClassHelper();
    WLXTUtils.dlHelper[classDatum.id].dir = WLXTUtils.dlDir.clone();
    WLXTUtils.dlHelper[classDatum.id].dir.append(classDatum.id);
    WLXTUtils.dlHelper[classDatum.id].dir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt("0700", 8));

    /*
     * TODO: this might change over the years
     *
     * 课程公告
     * open this
     *     http://learn.tsinghua.edu.cn/MultiLanguage/public/bbs/getnoteid_student.jsp?course_id=${id}
     * to get this
     *     http://learn.tsinghua.edu.cn/MultiLanguage/public/bbs/note_list_student.jsp?bbs_id=${bbs_id}&course_id=${course_id}
     * TODO: what's bbs id?
     */

    window.open("http://learn.tsinghua.edu.cn/MultiLanguage/public/bbs/getnoteid_student.jsp?course_id=" + classDatum.id);

    /*
     * 课程信息
     * http://learn.tsinghua.edu.cn/MultiLanguage/lesson/student/course_info.jsp?course_id=${id}
     *
     * 课程文件
     * http://learn.tsinghua.edu.cn/MultiLanguage/lesson/student/download.jsp?course_id=${id}
     *
     * 教学资源
     * http://learn.tsinghua.edu.cn/MultiLanguage/lesson/student/ware_list.jsp?course_id=${id}
     *
     * 课程作业
     * http://learn.tsinghua.edu.cn/MultiLanguage/lesson/student/hom_wk_brw.jsp?course_id=${id}
     *
     * 课程答疑
     * open this
     *     http://learn.tsinghua.edu.cn/MultiLanguage/public/bbs/getbbsid_student.jsp?course_id=${id}
     * to get this
     *     http://learn.tsinghua.edu.cn/MultiLanguage/public/bbs/bbs_list_student.jsp?bbs_id=${id}&course_id=${id}
     *
     * 课程讨论
     * open this
     *     http://learn.tsinghua.edu.cn/MultiLanguage/public/bbs/gettalkid_student.jsp?course_id=${id}
     * to get this
     *     http://learn.tsinghua.edu.cn/MultiLanguage/public/bbs/talk_list_student.jsp?bbs_id=${id}&course_id=${id}
     *
     * 自由讨论区
     * http://learn.tsinghua.edu.cn/MultiLanguage/public/discuss/main.jsp?course_id=${id}
     */

};

WLXT.DownloadData.checkCoursePageType = function(URL) {
    /*
     * check to see which page was opened as listed in @WLXT.DownloadData.downloadClass
     */

    /*
     * TODO: speed this up?
     */

    var pageType = {
        type : -1,
        id : "",
    };
    var regexExec;

    var noteIDRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/public\/bbs\/note_list_student\.jsp\?bbs_id\=\d+&course_id\=(\d+)/;
    if (( regexExec = noteIDRegex.exec(URL)) !== null) {
        pageType.type = WLXT.DownloadData.PageType.NOTE_ID;
        pageType.id = regexExec.pop();
        return pageType;
    }

    /* http://learn.tsinghua.edu.cn/MultiLanguage/public/bbs/note_reply.jsp?bbs_type=课程公告&id={POST_ID?}&course_id={COURSE_ID?} */
    var noteReplyRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/public\/bbs\/note_reply\.jsp\?bbs_type\=\S+&id\=(\d+)&course_id\=(\d+)/;
    if (( regexExec = noteReplyRegex.exec(URL)) !== null) {
        pageType.type = WLXT.DownloadData.PageType.NOTE_REPLY;
        pageType["courseID"] = regexExec.pop();
        pageType.id = regexExec.pop();
        return pageType;
    }

    var courseInfoRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/lesson\/student\/course_info\.jsp\?course_id\=(\d+)/;
    if (( regexExec = courseInfoRegex.exec(URL)) !== null) {
        pageType.type = WLXT.DownloadData.PageType.COURSE_INFO;
        pageType.id = regexExec.pop();
        return pageType;
    }

    var downloadRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/lesson\/student\/download\.jsp\?course_id\=(\d+)/;
    if (( regexExec = downloadRegex.exec(URL)) !== null) {
        pageType.type = WLXT.DownloadData.PageType.DOWNLOAD;
        pageType.id = regexExec.pop();
        return pageType;
    }

    var wareListRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/lesson\/student\/ware_list\.jsp\?course_id\=(\d+)/;
    if (( regexExec = wareListRegex.exec(URL)) !== null) {
        pageType.type = WLXT.DownloadData.PageType.WARE_LIST;
        pageType.id = regexExec.pop();
        return pageType;
    }

    var homWkBrwRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/lesson\/student\/hom_wk_brw\.jsp\?course_id\=(\d+)/;
    if (( regexExec = homWkBrwRegex.exec(URL)) !== null) {
        pageType.type = WLXT.DownloadData.PageType.HOM_WK_BRW;
        pageType.id = regexExec.pop();
        return pageType;
    }

    var bbsIDStudentRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/public\/bbs\/bbs_list_student\.jsp\?bbs_id\=\d+&course_id\=(\d+)/;
    if (( regexExec = bbsIDStudentRegex.exec(URL)) !== null) {
        pageType.type = WLXT.DownloadData.PageType.BBS_ID_STUDENT;
        pageType.id = regexExec.pop();
        return pageType;
    }

    var talkIDStudentRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/public\/bbs\/talk_list_student\.jsp\?bbs_id\=\d+&course_id\=(\d+)/;
    if (( regexExec = talkIDStudentRegex.exec(URL)) !== null) {
        pageType.type = WLXT.DownloadData.PageType.TALKID_STUDENT;
        pageType.id = regexExec.pop();
        return pageType;
    }

    var discussMainRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/public\/discuss\/main\.jsp\?course_id\=(\d+)/;
    if (( regexExec = discussMainRegex.exec(URL)) !== null) {
        pageType.type = WLXT.DownloadData.PageType.DISCUSS_MAIN;
        pageType.id = regexExec.pop();
        return pageType;
    }

    return pageType;
};

WLXT.DownloadData.onPageLoad = function(aEvent) {

    /*
     * TODO: change how page is detected?
     */
    switch (aEvent.target.URL) {

        // only for exact matches
        case "http://learn.tsinghua.edu.cn/":
            /*
             * change DOM of WLXT login page
             */
            var loginTableBody = aEvent.target.getElementsByTagName('body')[0].getElementsByTagName('table')[4].getElementsByTagName('tbody')[0];
            var notifyUserCell = loginTableBody.insertRow(0).insertCell(0);
            notifyUserCell.innerHTML = '<strong style="color: red">下载网络学堂从这里登录</strong>';
            break;

        case "http://learn.tsinghua.edu.cn/MultiLanguage/lesson/student/mainstudent.jsp":
            window.open("http://learn.tsinghua.edu.cn/MultiLanguage/lesson/student/MyCourse.jsp?typepage=2", "wlxt_list_window", WLXT.DownloadData.strWindowFeatures);
            aEvent.target.defaultView.close();
            break;

        case "http://learn.tsinghua.edu.cn/MultiLanguage/lesson/student/MyCourse.jsp?typepage=2":
            /*
             * get course listing
             */
            var classRows = aEvent.target.getElementById("info_1").rows;
            var classData = {};

            var classDirFile = WLXTUtils.dlDir.clone();
            classDirFile.append("course_id.csv");
            classDirFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt("0600", 8));

            var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
            foStream.init(classDirFile, -1, parseInt("0600", 8), 0);
            var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
            converter.init(foStream, "UTF-8", 0, 0);

            for (var i = 0; i < classRows.length - 2; ++i) {
                var classDatum = WLXT.DownloadData.getClassNameURL(classRows[i + 2]);
                classData[classDatum.id] = classDatum;
                converter.writeString("\"" + classDatum.id + "\",\"" + classDatum.name + "\"" + "\n");
            }

            converter.close();

            //XXX remove next line and related
            var j = 0;
            for (var courseID in classData) {
                //XXX remove next line and related
                if (j >= 1) {
                    //break;
                }
                j += 1;
                WLXT.DownloadData.downloadClass(classData[courseID]);

            }
            //aEvent.target.defaultView.close();//XXX
            break;

        default:

            var pageType = WLXT.DownloadData.checkCoursePageType(aEvent.target.URL);
            switch(pageType.type) {

                // for regex matches
                case WLXT.DownloadData.PageType.NOTE_ID:
                    WLXTUtils.dlHelper[pageType.id].kcggDir = WLXTUtils.dlHelper[pageType.id].dir.clone();
                    WLXTUtils.dlHelper[pageType.id].kcggDir.append("kcgg");
                    WLXTUtils.dlHelper[pageType.id].kcggDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt("0700", 8));

                    var kcggCSV = WLXTUtils.dlHelper[pageType.id].kcggDir.clone();
                    kcggCSV.append("kcgg.csv");
                    kcggCSV.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt("0600", 8));

                    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
                    foStream.init(kcggCSV, -1, parseInt("0600", 8), 0);
                    var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
                    converter.init(foStream, "UTF-8", 0, 0);

                    var notesRows = aEvent.target.getElementById("table_box").rows;
                    if (notesRows.length == 0) {
                        //TODO: remove this?
                        throw "length of NOTE_ID notesRows is 0!";
                    }
                    for (var i = 1; i != notesRows.length; i++) {
                        var noteMetaInfo = {
                            serial : notesRows[i].cells[0].innerHTML.trim(),
                            title : notesRows[i].cells[1].getElementsByTagName("a")[0].innerHTML.trim(),
                            publisher : notesRows[i].cells[2].innerHTML.trim(),
                            date : notesRows[i].cells[3].innerHTML.trim(),
                            URL : notesRows[i].cells[1].getElementsByTagName("a")[0].href.trim(),
                        };
                        var noteReplyRegex = /http\:\/\/learn\.tsinghua\.edu\.cn\/MultiLanguage\/public\/bbs\/note_reply\.jsp\?bbs_type\=\S+&id\=(\d+)&course_id\=\d+/;
                        var noteID = noteReplyRegex.exec(noteMetaInfo.URL).pop();
                        converter.writeString("\"" + noteID + "\",\"" + noteMetaInfo.serial + "\",\"" + noteMetaInfo.title + "\",\"" + noteMetaInfo.publisher + "\",\"" + noteMetaInfo.date + "\"");

                        window.open(noteMetaInfo.URL);

                    }

                    converter.close();
                    aEvent.target.defaultView.close();

                    break;

                case WLXT.DownloadData.PageType.NOTE_REPLY:
                    var noteTable = aEvent.target.getElementById("table_box");
                    var noteTitle = noteTable.getElementsByTagName("td")[1].innerHTML.trim();
                    var noteContent = noteTable.getElementsByTagName("td")[3].innerHTML.trim();

                    var noteFile = WLXTUtils.dlHelper[pageType.courseID].kcggDir.clone();
                    noteFile.append(pageType.id + ".html");
                    noteFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt("0600", 8));

                    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
                    foStream.init(noteFile, -1, parseInt("0600", 8), 0);
                    var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
                    converter.init(foStream, "UTF-8", 0, 0);

                    converter.writeString("<p>" + noteTitle + "</p>\n\n<p>" + noteContent + "</p>");

                    converter.close();

                    aEvent.target.defaultView.close();
                    break;

                case WLXT.DownloadData.PageType.COURSE_INFO:
                    break;

                case WLXT.DownloadData.PageType.DOWNLOAD:
                    break;

                case WLXT.DownloadData.PageType.WARE_LIST:
                    break;

                case WLXT.DownloadData.PageType.HOM_WK_BRW:
                    break;

                case WLXT.DownloadData.PageType.BBS_ID_STUDENT:
                    break;

                case WLXT.DownloadData.PageType.TALKID_STUDENT:
                    break;

                case WLXT.DownloadData.PageType.DISCUSS_MAIN:
                    break;

                default:

                    //XXX remove this
                    Application.console.log(aEvent.target.URL);

                    break;

            }

            break;

    }
};

WLXT.DownloadData.init = function() {
    if (gBrowser) {
        gBrowser.addEventListener("DOMContentLoaded", WLXT.DownloadData.onPageLoad, false);
    }
};

/*
 * open learn.tsinghua.edu.cn in a new window
 */
WLXT.DownloadData.openLearn = function() {
    window.open("http://learn.tsinghua.edu.cn", "wlxt_login_window", WLXT.DownloadData.strWindowFeatures);

    WLXTUtils.dlDir = FileUtils.getDir("DfltDwnld", ["wlxt"], true);
};

window.addEventListener("load", function load(event) {
    window.removeEventListener("load", load, false);
    //remove listener, no longer needed
    WLXT.DownloadData.init();
}, false);

document.addEventListener("openCourse", function(aEvent) {
}, false);
