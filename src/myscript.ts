const DEFAULT_VERSION = "2.0";
const DEFAULT_PRODID = "-//TypeScript/Node.js//SCAU Course Exporter v1.0//CN"
const CRLF = "\r\n"
const SPACE = " "
const iframe = <HTMLIFrameElement>document.querySelector("#iframeautoheight");

console.log("Fucking ZhengFang")

const PAGE = {
    "main" : /xs_main.aspx/,
    "course_table": /xskbcx.aspx/
}

interface IProperty {
    name: string;
    value: string;
}

class Value<T> {
    public properties: Array<IProperty>;
    public content: T;
    constructor(_init: T) {
        this.content = _init;
    }
}

class VEvent {
    public uid:         Value<string>;
    public dtstamp:     Value<Date>;
    public organizer:   Value<string>;
    public dtstart:     Value<Date>;
    public dtend:       Value<Date>;
    public location:    Value<string>;
    public summary:     Value<string>;
    public categories:  Value<Array<string>>;
    public _class:      Value<string>;

    public constructor(evt?: any) {
        if (evt)
        {
           this.uid = evt.uid; 
           this.dtstamp = evt.dtstamp;
           this.organizer = evt.organizer;
           this.dtstart = evt.dtstart;
           this.dtend = evt.dtend;
           this.summary = evt.summary;
           this.categories = evt.categories;
           this._class = evt._class;
        }
    }

}

class VCalendar {
    events: Array<VEvent>;
    version: string;
    prodid: string;

    constructor() {
        this.version = DEFAULT_VERSION;
        this.prodid = DEFAULT_PRODID;
        this.events = new Array<VEvent>();
    }

}

function isDigit(_dat: string): boolean {
    let _zero = "0".charCodeAt(0);
    let _ni = "9".charCodeAt(0);
    let _code = _dat.charCodeAt(0);
    if (_code >= _zero && _code <= _ni)
        return true;
    else
        return false;
}

interface RawCourse {
    name: string;
    quantity: number;
    timeinfo: string;
    teacher_name: string;
    location?: string;
    examinfo? :string;
}

interface RawCourseData {
    schoolYear: string;
    term: string;
    courses: Array<RawCourse>;
}

interface ISchoolYear {
    from: number;
    to: number;
};

interface ISchoolWeek {
    from: number;
    to: number;
    flag: number; // 0 for all weeks, 1 for single weeks, 2 for double weeks
}

enum Day {
    Monday = 1, TuesDay, Wednesday,
    ThursDay, Friday, Saturday, Sunday
};

class Teacher {
    name: string

    constructor ( _name: string) {
        this.name = _name;
    }
};

class Course {
    uid: number;
    name: string;
    schoolYear: ISchoolYear;
    term: number;
    teacher: Teacher;
    schoolWeeks: ISchoolWeek;
    courseNumbers: Array<number>;
    location: string;
    day: Day;
};

function createCalendar(courses: Array<Course>, startDate: Date, dtstamp?: Date): VCalendar {
    console.assert(startDate && startDate.getDay() === 1)
    if (!dtstamp) dtstamp = new Date();

    function eventFactory(course: Course): Array<VEvent> {
        let result = new Array<VEvent>();
        const course_begin_table = {
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

        const course_end_table = {
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

        for (var week = course.schoolWeeks["from"]; week <= course.schoolWeeks["to"]; ++week) {
            var _flag = course.schoolWeeks.flag;

            if ((_flag === 1 && week % 2 === 0) ||          // odd week course && week is even
            (_flag === 2 && week % 2 === 1)) continue;      // even week course && week is odd

            let _evt = new VEvent();

            let _start = new Date(startDate.toString());
            let _end = new Date(startDate.toString())

            _start.setDate(_start.getDate() + (week - 1) * 7 + (course.day - 1));
            _start.setHours(course_begin_table[course.courseNumbers[0]].hour);
            _start.setMinutes(course_begin_table[course.courseNumbers[0]].minute);
            _start.setSeconds(0);
            _start.setMilliseconds(0);

            _end.setDate(_end.getDate() + (week - 1) * 7 + (course.day - 1));
            _end.setHours(course_end_table[course.courseNumbers[course.courseNumbers.length - 1]].hour);
            _end.setMinutes(course_end_table[course.courseNumbers[course.courseNumbers.length - 1]].minute);
            _end.setSeconds(0);
            _end.setMilliseconds(0);

            if (dtstamp) _evt.dtstamp = new Value(dtstamp);
            _evt.uid = new Value("course#" + 
                    course.schoolYear.from.toString() + "#" +
                    course.uid.toString() + "#" + 
                    week.toString())
            _evt.summary = new Value(course.name + 
            " (" + course.teacher.name + ")");
            _evt.location = new Value(course.location);
            _evt.dtstart = new Value(_start);
            _evt.dtend = new Value(_end);

            result.push(_evt);
        }
        return result;
    }

    var result = new VCalendar();
    for (var i=0; i < courses.length; ++i) {
        result.events = result.events.concat(eventFactory(courses[i]))
    }
    return result;
}

function cookCourse(raw: RawCourseData): Array<Course> {

    function parseSchoolYear(_str: string) : ISchoolYear {
        let number_test = /[0-9]+/g;
        let _data = _str.match(number_test);

        if (_data.length < 2)
            return null;
        else
            return {
                from: parseInt(_data[0]),
                to: parseInt(_data[1])
            }
    }

    function parseSchoolWeek(_timeinfo: string) : ISchoolWeek {
        let school_week_tester = /{[^}]+}/;
        let _fuck = _timeinfo.match(school_week_tester);
        if (_fuck === null || _fuck.length < 1) return null;
        let info = _fuck[0].slice(1, _fuck[0].length-1); // get the info in the brackets
        let _data = {
            from: 0,
            to: 0,
            flag: 0
        }

        let _single = info.match("单周");
        let _double = info.match("双周");

        if (_single && _single.length > 0)
            _data.flag = 1;
        else if (_double && _double.length > 0)
            _data.flag = 2;
        else
            _data.flag = 0;

        let _number_test= /[0-9]+/g;
        let _dat = info.match(_number_test);
        if (_dat && _dat.length >= 2) {
            _data["from"] = parseInt(_dat[0]);
            _data["to"] = parseInt(_dat[1]);
        }
        
        return _data;
    }

    function parseCourseNumber(timeinfo: string): Array<number> {
        let _bracket_index = timeinfo.indexOf("{");
        let _slice = timeinfo.slice(0, _bracket_index);

        let _number_test= /[0-9]+/g;
        let _dat = _slice.match(_number_test);

        let result = new Array<number>();
        
        _dat.forEach((value: string) => {
            result.push(parseInt(value));
        })

        return result;
    }

    function parseDay(_timeinfo: string) : Day {
        // _timeinfo[0] should be "周"
        var word = _timeinfo[1];
        switch(word) {
            case "一":
                return Day.Monday;
            case "二":
                return Day.TuesDay;
            case "三":
                return Day.Wednesday;
            case "四":
                return Day.ThursDay;
            case "五":
                return Day.Friday;
            case "六":
                return Day.Saturday;
            case "日":
                return Day.Sunday;
            default:
                return null;
        }
    }

    let raw_co = raw.courses;
    let result = new Array<Course>();
    let _term = parseInt(raw.term);

    for (var i=0; i < raw_co.length; ++i) {
        var course = new Course();
        course.uid = i;
        course.name = raw_co[i].name;
        course.term = parseInt(raw.term);
        course.schoolYear = parseSchoolYear(raw.schoolYear);
        course.schoolWeeks = parseSchoolWeek(raw_co[i].timeinfo);
        course.location = raw_co[i].location;
        course.teacher = new Teacher(raw_co[i].teacher_name);
        course.courseNumbers = parseCourseNumber(raw_co[i].timeinfo);
        course.day = parseDay(raw_co[i].timeinfo);
        result.push(course);
    }
    return result;
}

function exportCourse(doc: Document) : Array<RawCourse> {
    function tryParse(td: HTMLTableCellElement) : RawCourse {
        var str = td.innerHTML;
        const rowspan = td.rowSpan;

        if (str && str.length > 0) {
            str = str.replace(/<br>/g, "\n")
            var _data = str.match(/[^\n]+/g)
            if (_data.length >= 3) {
                var data: RawCourse = {
                    name: _data[0],
                    timeinfo: _data[1],
                    teacher_name: _data[2],
                    quantity: 1
                }
                if (_data.length >= 4)
                    data.location = _data[3]
                if (_data.length >= 5)
                    data.examinfo = _data[4]
                if (rowspan)
                    data.quantity = <number>rowspan;
                return data;
            }
        }
        return null
    }
    var result = new Array<RawCourse>()
    const table = <HTMLTableElement>doc.querySelector('#Table1')
    const tds = <NodeListOf<HTMLTableDataCellElement>>table.querySelectorAll('td')
    for (var i = 0; i < tds.length; ++i) {
        var _td = tds[i]
        var re = tryParse(_td)
        if (re)
            result.push(re)
    }
    return result;
}

var ENDL = "\n";

function genDate(_d: Date): string {

    function getFixedLen(s: string, len: number): string {
        if (s.length < len) {
            return getFixedLen("0" + s, len)
        } else if (s.length > len) {
            return s.slice(0, len)
        }
        else return s
    }

    var result = ""
    result += getFixedLen(_d.getUTCFullYear().toString(), 4)
    result += getFixedLen((_d.getUTCMonth() + 1).toString(), 2)
    result += getFixedLen(_d.getUTCDate().toString(), 2)
    result += "T"
    result += getFixedLen(_d.getUTCHours().toString(), 2)
    result += getFixedLen(_d.getUTCMinutes().toString(), 2)
    result += getFixedLen(_d.getUTCSeconds().toString(), 2)
    result += "Z"
    return result
}

function iCalGen(obj: any): Array<string> {
    // var result = "";
    var result = new Array<string>();
    if (obj instanceof VEvent) {
        var _evt = <VEvent>obj;
        result.push("BEGIN:VEVENT");
        result.push("UID:" + _evt.uid.content);
        result.push("DTSTAMP:" + genDate(_evt.dtstamp.content));
        if (_evt.organizer)
            result.push("ORGANIZER:" + _evt.organizer.content)
        if (_evt.location)
            result.push("LOCATION:" + _evt.location.content);
        result.push("DTSTART:" + genDate(_evt.dtstart.content));
        result.push("DTEND:" + genDate(_evt.dtend.content));
        result.push("SUMMARY:" + _evt.summary.content);
        result.push("END:VEVENT");
    } else if (obj instanceof VCalendar) {
        var _cal = <VCalendar>obj;
        result.push("BEGIN:VCALENDAR");
        result.push("VERSION:" + _cal.version);
        result.push("PRODID:" + _cal.prodid);
        for (var i = 0; i < _cal.events.length; ++i)
            result = result.concat(iCalGen(_cal.events[i]));
        result.push("END:VCALENDAR");
    } 
    return result;
};

function genFinal(init: Array<string>): string {
    var result = ""
    for (var i=0; i < init.length; ++i)
    {
        var finalLine = "";
        var line = init[i];
        var len = line.length;
        if (len > 60) // dangerous
        {
            var remain_len = len;
            var index = 0;
            while (remain_len > 0)
            {
                for (var i = 0; i < index; ++i)
                    result += SPACE;
                result += line.slice(0, 60);
                line = line.slice(61);
                remain_len -= 60;
                index++;
            }
            line.slice(0, 60);
        }
        else
            finalLine = line;
        result += line + CRLF;
    }
    return result
}

function calendarGen(cal: VCalendar): string {
    return genFinal(iCalGen(cal))
}

if (iframe) {
    iframe.addEventListener('load', function() {
        const content = iframe.contentDocument || iframe.contentWindow.document
        const URL = content.location.href

        if (PAGE['course_table'].test(URL)){
            const schoolyear_select = <HTMLSelectElement>content.querySelector('#xnd')
            const term_select = <HTMLSelectElement>content.querySelector('#xqd')
            const inject_td = <HTMLTableDataCellElement>content
                .querySelector('#Table2 > tbody > tr:nth-child(1) > td:nth-child(1)')
            const inject_p = content.createElement("p")
            const export_span = content.createElement("span")
            const export_first_day = content.createElement('input')
            const export_btn = content.createElement('button')
            const dwn_anchor = content.createElement("a")
            dwn_anchor.innerHTML= "Download the .ics file"
            dwn_anchor.style.visibility = "hidden"

            inject_p.appendChild(export_span)
            inject_p.appendChild(export_first_day)
            inject_p.appendChild(export_btn)
            inject_p.appendChild(dwn_anchor)

            inject_td.appendChild(content.createElement("br"))
            inject_td.appendChild(inject_p)

            export_span.innerHTML = "   这个学期的第一个星期一是："
            export_first_day.type = "date"
            export_first_day.value = "2016-08-29"

            export_btn.innerText = "导出课表"
            export_btn.addEventListener('click', (evt: MouseEvent) => {
                evt.preventDefault()
                var raw_courses = exportCourse(content)
                var data = {
                    courses: raw_courses,
                    schoolYear: schoolyear_select.value,
                    term: term_select.value
                }

                // ipcRenderer.send('zf-raw-course-data', data);
                var courses = cookCourse(data)
                var first_day = new Date(export_first_day.value)
                var cal = createCalendar(courses, first_day)
                var result = calendarGen(cal)

                var link = window.URL.createObjectURL(new Blob([result], {
                    type: "text/x-vCalendar"
                }))

                dwn_anchor.style.visibility = "visible"
                dwn_anchor.setAttribute("href", link)
                dwn_anchor.setAttribute("download", "cal.ics")
            })


        }
    })

}

