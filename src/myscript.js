"use strict"

var CRLF = "\r\n",
    SPACE = " ",
    iframe = document.querySelector("#iframeautoheight");

var PAGE = {
    main: /xs_main.aspx/,
    course_table: /xskbcx.aspx/
};
	
var course_begin_table = {
    1: {hour: 8, minute: 0},
    2: {hour: 8, minute: 50},
    3: {hour: 10, minute: 5},
    4: {hour: 10, minute: 55},
    5: {hour: 12, minute: 30},
    6: {hour: 13, minute: 20},
    7: {hour: 14, minute: 30},
    8: {hour: 15, minute: 20},
    9: {hour: 16, minute: 35},
    10: {hour: 17, minute: 25},
    11: {hour: 19, minute: 30},
    12: {hour: 20, minute: 20},
    13: {hour: 21, minute: 10},
};

var course_end_table = {
    1: {hour: 8, minute: 45},
    2: {hour: 9, minute: 35},
    3: {hour: 10, minute: 50},
    4: {hour: 11, minute: 40},
    5: {hour: 13, minute: 15},
    6: {hour: 14, minute: 5},
    7: {hour: 15, minute: 15},
    8: {hour: 16, minute: 5},
    9: {hour: 17, minute: 20},
    10: {hour: 18, minute: 10},
    11: {hour: 20, minute: 15},
    12: {hour: 21, minute: 5},
    13: {hour: 21, minute: 55},
};


function property(name, value) {
    this.name = name;
    this.value = value;
}

function value(properties, content) {
    this.properties = properties;
    this.content = content;
}


function parseSchoolYear(_str) {
    var number_test = /[0-9]+/g;
    var _data = _str.match(number_test);

    if (_data.length < 2)
        return null;
    else
        return {
            from: parseInt(_data[0]),
            to: parseInt(_data[1])
        }
}

function parseSchoolWeek(_timeinfo) {
    var school_week_tester = /{[^}]+}/;
    var _fuck = _timeinfo.match(school_week_tester);
    
    if (_fuck === null || _fuck.length < 1) return null;

    var info = _fuck[0].slice(1, _fuck[0].length-1); // get the info in the brackets
    var _data = {
        from: 0,
        to: 0,
        flag: 0
    }

    var _single = info.match("单周");
    var _double = info.match("双周");

    if (_single && _single.length > 0)
        _data.flag = 1;
    else if (_double && _double.length > 0)
        _data.flag = 2;
    else
        _data.flag = 0;

    var _number_test= /[0-9]+/g;
    var _dat = info.match(_number_test);
    if (_dat && _dat.length >= 2) {
        _data["from"] = parseInt(_dat[0]);
        _data["to"] = parseInt(_dat[1]);
    }
    
    return _data;
}

function parseCourseNumber(timeinfo) {
    var _bracket_index = timeinfo.indexOf("{");
    var _slice = timeinfo.slice(0, _bracket_index);

    var _number_test= /[0-9]+/g;
    var _dat = _slice.match(_number_test);

    var result = [];
    
    _dat.forEach(function (value) {
        result.push(parseInt(value));
    });

    return result;
}

function parseDay(_timeinfo) {
    // _timeinfo[0] should be "周"
    var word = _timeinfo[1];
    switch(word) {
    case "一":
        return 1;
    case "二":
        return 2;
    case "三":
        return 3;
    case "四":
        return 4;
    case "五":
        return 5;
    case "六":
        return 6;
    case "日":
        return 7;
    default:
        return null;
    }
}

function cookCourse(rawData) {
    var raw_course = rawData.courses,
	_term = parseInt(raw.term);

	return raw_course.map(function (course, index) {
		var course = {
			uid: index,
			name: course.name,
			term: parseInt(raw.term),
			schoolYear: parseSchoolYear(rawData.schoolYear),
			schoolWeeks: parseSchoolWeek(course.timeinfo),
			location: course.loaction,
			teacher: course.teacher_name,
			courseNumbers: parseCourseNumber(course.timeinfo),
			day: parseDay(course.timeinfo),
		};

		result.push(course);
	});

}

function Calender(courses, first_day_date) {

}

Calender.prototype.toString = function () {
}

if (iframe) {
    iframe.addEventListener('load', function() {
	var content = iframe.contentDocument || iframe.contentWindow.document;
	var URL = content.location.href;

	if (PAGE.course_table.test(URL)) {
	    var schoolyesr_select = content.querySelector('#xnd'),
		term_select = content.querySelector('#xqd'),
		inject_td = content.querySelector('#Table2 > tbody > tr:nth-child(1) > td:nth-child(1)'),
		inject_p = content.createElement("p"),
		export_span = content.createElement("span"),
		export_first_day = content.createElement('input'),
		export_btn = content.createElement('button'),
		dwn_anchor = content.createElement("a");
	    
            dwn_anchor.innerHTML= "Download the .ics file";
            dwn_anchor.style.visibility = "hidden";

            inject_p.appendChild(export_span);
            inject_p.appendChild(export_first_day);
            inject_p.appendChild(export_btn);
            inject_p.appendChild(dwn_anchor);

            inject_td.appendChild(content.createElement("br"));
            inject_td.appendChild(inject_p);

            export_span.innerHTML = "   这个学期的第一个星期一是："
            export_first_day.type = "date"
            export_first_day.value = "2016-08-29"

            export_btn.innerText = "导出课表"
            export_btn.addEventListener('click', function (evt: MouseEvent) {
                evt.preventDefault();
		
                var raw_courses = exportCourse(content);
                var data = {
                    courses: raw_courses,
                    schoolYear: schoolyear_select.value,
                    term: term_select.value
                };

                var courses = cookCourse(data);
                var first_day = new Date(export_first_day.value);
                var cal = new Calendar(courses, first_day);
                var result = cal.toString();

                var link = window.URL.createObjectURL(new Blob([result], {
                    type: "text/x-vCalendar"
                }));

                dwn_anchor.style.visibility = "visible";
                dwn_anchor.setAttribute("href", link);
                dwn_anchor.setAttribute("download", "cal.ics");
            })
	}
    })
)

