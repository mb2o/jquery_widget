

// initial declaration of timeglider
var timeglider = window.timeglider = {version:"0.1.0"};


/*
*  TGDate
*
* You might be wondering why we're not extending the JS Date()
* object: that might be a good idea eventually. There are some
* major issues with Date(): the "year zero" (or millisecond)
* in JS and other date APIs is 1970, so timestamps are negative
* prior to that. The timestamp of 100,000+ bce gets a little 
* large, breaking at some point where Date can't deal with deep
* bce dates.
*
* This TGDate object also has functionality which  goes hand-in-hand
* with the date hashing system: each event on the timeline is hashed
* according to day, year, decade, century, millenia, etc
*/



(function(tg){


tg.TGDate = function (strOrNum) {
    
    var dateStr, isoStr, gotSec;
    
    // Morton, we've got seconds coming in!
    if (typeof(strOrNum) == "number") {
        dateStr = isoStr = TGDate.getDateFromSec(strOrNum);
        gotSec = strOrNum;
    } else {
        dateStr = isoStr = strOrNum;
    }
  
	  if (isValidDateString(dateStr) === "shit") {
	    return {error:"Invalid date"};
	    /// it's valid
    } else {
	    	    
    		dateStr = dateStr.replace(",", "");
  
    		if (dateStr.substr(0,1) == "-") {
    		  this.bce=1;
    		  dateStr = dateStr.substr(1);
    		} else {
    		  this.bce=0;
  		  }

    		// remove anything not a number like "bce", etc, and
    		// make for an easy split!
    		dateStr = dateStr.replace(/[^0-9]/g, "-");

    		var arr = dateStr.split("-");

    		this.ye = boil(arr[0]);
    		this.mo = boil(arr[1]);
    		this.mo_num = getMoNum(this.mo, this.ye);
    		this.da = boil(arr[2]);
    		this.ho = boil(arr[3]);
    		this.mi = boil(arr[4]);
    		// .se second is the clock second -- 0-60
    		this.se = boil(arr[5]);
    		// rd : serial day from year zero
    		this.rd  = TGDate.getRataDie(this);
    		// .sec second is the serial second from year 0!
    		this.sec = gotSec || getSec(this);
    		
    		this.dateStr = isoStr;

		} 
		
		/// INTERNAL FUNCTIONS

	    function isValidDateString(str) {
    	  // VALIDATE STRING
    	  var aStr = jQuery.trim(str);
    		reg = new RegExp(/[0-9-: ]/);
    		if (reg.test(aStr)) {
    		  return aStr;
    	  } else {
    	    return "shit";
        }
      };
  
  
    	/*
    	* isValidDate
    	* Rejects dates like "2001-13-32" and such
    	* TODO: make sure no non leap years have Feb 29
    	*
    	*/
    	function isValidDate (ye, mo, da) {
	  
    		var ld = TGDate.getMonthDays(mo, ye);
    		// day isn't appropriate for month
    		if ((da > ld) || (da <= 0)) { return false; } 
    		// invalid month numbers
    		if ((mo > 12) || (mo < 0)) { return false; }
    		// there's no year "0"
    		if (ye == 0) { return false; }
    	  // Is it a hex number? We need to make sure it's only got 0-9
    		if ((typeof ye != "number") || (String(ye).match(/([0-9]+)/) == false)) { return false; }
	
    		return true;
    	};
	
      /*
      * boil
      * basic wrapper for parseInt to clean leading zeros,
      * as in dates
      */
    	function boil (n) {
    		return parseInt(n, 10);
    	};


    	function getSec (fd) {
    		// 
    		var daSec = Math.abs(fd.rd) * 86400;
    		var hoSec = (fd.ho) * 3600;
    		var miSec = (fd.mi - 1) * 60;
    		var bc = 1;
    		if (fd.rd < 0) bc = -1;
    		return bc * (daSec + hoSec + miSec);
    	};


  
      /* getMoNum
      *
      * @param mo {Number} month from 1 to 12
      * @param ye {Number} straight year
      *
      */ 
      function getMoNum (mo, ye) {
      	    if (ye > 0) {
      			return  ((ye -1) * 12) + mo;
      		} else {
      			return getMoNumBC(mo, ye);
      		}
      };
  
  
  
      /*
      * getMoNumBC
      * In BC time, serial numbers for months are going backward
      * starting with December of 1 bce. So, a month that is actually
      * "month 12 of year -1" is actually just -1, and November of 
      * year 1 bce is -2. Capiche!?
      *
      * @param {object} ob ---> .ye (year)  .mo (month)
      * @return {number} serial month number (negative in this case)
      */
      function getMoNumBC (mo, ye) {
      	var absYe = Math.abs(ye);
      	var n = ((absYe - 1) * 12) + (12-(mo -1));
      	return -1 * n;
      };

} // end TGDate Function



var TGDate = tg.TGDate;




/*
*  getTimeUnitSerial
*  gets the serial number of specified time unit, using a ye-mo-da date object
*  used in addToTicksArray() in Mediator
*
*  @param fd {object} i.e. the focus date: {ye:1968, mo:8, da:20}
*  @param unit {string} scale-unit (da, mo, ye, etc)
*
*  @return {number} a non-zero serial for the specified time unit
*/
TGDate.getTimeUnitSerial = function (fd, unit) {
		switch (unit) {
			case "ye": return fd.ye; break;
			// set up mo_num inside TGDate constructor
			case "mo": return fd.mo_num; break;
			case "da": return fd.rd;
			case "de": return Math.ceil(fd.ye / 10); break;
			case "ce": return Math.ceil(fd.ye / 100); break;
			case "thou": return Math.ceil(fd.ye / 1000); break;
			case "tenthou": return Math.ceil(fd.ye / 10000); break;
			case "hundredthou": return Math.ceil(fd.ye / 100000); break;
			case "mill": return Math.ceil(fd.ye / 1000000); break;
			case "tenmill": return Math.ceil(fd.ye / 10000000); break;
			case "hundredmill": return Math.ceil(fd.ye / 100000000); break;
			case "bill": return Math.ceil(fd.ye / 1000000000); break;
		}
};



TGDate.getMonthDays = function(mo,ye) {
	if ((TGDate.isLeapYear(ye) == true) && (mo==2)) {
		return 29;
	} else  {
		return TGDate.monthsDayNums[mo];
	}
};


TGDate.twentyFourToTwelve = function (e) {
	
	var dob = {};
	dob.ye = e.ye;
	dob.mo = e.mo;
	dob.da = e.da;
	dob.ho = e.ho;
	dob.mi = e.mi;
	dob.ampm = "am";

	if (e.ho) {
		if (e.ho >= 12) {
			dob.ampm = "pm";
			if (e.ho > 12) {
				dob.ho = e.ho - 12;
			} else {
				dob.ho = 12;
			}
		} else if (e.ho == 0) {
			dob.ho = 12;
			dob.ampm = "am";
		} else {
			dob.ho = e.ho;
		}
	} else {
		dob.ho = 12;
		dob.mi = 0;
		dob.ampm = "am";
	}
	
	return dob;
};



	


	
/*
* RELATES TO TICK WIDTH: SPECIFIC TO TIMELINE VIEW
*/
TGDate.getMonthAdj = function (serial, tw) {
	var d = TGDate.getDateFromMonthNum(serial);
	var w;
	switch (d.mo) {
		
		// 31 days
		case 1: case 3: case 5: case 7: case 8: case 10: case 12:
			var w = Math.floor(tw + ((tw/28) * 3));
			return {"width":w, "days":31};
		break;

		// Blasted February!
		case 2:
		if (TGDate.isLeapYear(d.ye) == true) {
			w = Math.floor(tw + (tw/28));
			return {"width":w, "days":29};
		} else {
			return {"width":tw, "days":28};
		}
		break;
		
		default: 
		// 30 days
		w = Math.floor(tw + ((tw/28) * 2));
		return {"width":w, "days":30};
	}
	
	
};













/*
* getDateFromMonthNum
* Gets a month (1-12) and year from a serial month number
* @param mn {number} serial month number
* @return {object} ye, mo (numbers)
*/
TGDate.getDateFromMonthNum = function(mn) {

	var rem = 0;
	var ye, mo;

	if (mn > 0) {
		rem = mn % 12;

		if (rem == 0) { rem = 12 };

		mo = rem;
		ye = Math.ceil(mn / 12);

	} else {
		// BCE!
		rem = Math.abs(mn) % 12;
		mo = (12 - rem) + 1;
		if (mo == 13) mo = 1;
		// NOYEARZERO problem: here we would subtract
		// a year from the results to eliminate the year 0
		ye =  -1 * Math.ceil(Math.abs(mn) / 12); // -1

		}
		
	return {ye:ye, mo:mo};
};



/*
* getMonthWidth
* Starting with a base-width for a 28-day month, calculate
* the width for any month with the possibility that it might
* be a leap-year February.
*
* @param mo {number} month i.e. 1 = January, 12 = December
* @param ye {number} year
*
* RELATES TO TICK WIDTH: SPECIFIC TO TIMELINE VIEW
*/
TGDate.getMonthWidth = function(mo,ye,tickWidth) {

	var dayWidth = t / 28;
	var ad;
	var nd = 28;

	switch (mo) {
		case 1: case 3: case 5: case 7: case 8: case 10: case 12: ad = 3; break;
		case 4: case 6: case 9: case 11: ad = 2; break;
		// leap year
		case 2: if (TGDate.isLeapYear(yr) == true) { ad = 1; } else { ad=0; }; break;
		
	}

	var width = Math.floor(tickWidth + (dayWidth * ad));
	var days = nd + ad;

	return {width:width, numDays:days};
};




TGDate.getToday = function () {
    var d = new Date(); 
    return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":00";
}


/*
 * Helps calculate the position of a modulo remainder in getRataDie()
 */
TGDate.getMonthFromRemDays = function (dnum, yr) {

	var tack = 0;
	var rem = 0;
	var m = 0;

	if (TGDate.isLeapYear(yr)){ tack = 1; } else { tack=0; }
	
	if (dnum <= 31) { m = 1; rem = dnum; }
	else if ((dnum >31) && (dnum <= 59 + tack)) { m = 2; rem = dnum - (31 + tack); }
	else if ((dnum > 59 + tack) && (dnum <= 90 + tack)) { m = 3; rem = dnum - (59 + tack); }
	else if ((dnum > 90 + tack) && (dnum <= 120 + tack)) { m = 4; rem = dnum - (90 + tack); }
	else if ((dnum > 120 + tack) && (dnum <= 151 + tack)) { m = 5; rem = dnum - (120 + tack); }
	else if ((dnum > 151 + tack) && (dnum <= 181 + tack)) { m = 6; rem = dnum - (151 + tack); }
	else if ((dnum > 181 + tack) && (dnum <= 212 + tack)) { m = 7; rem = dnum - (181 + tack); }
	else if ((dnum > 212 + tack) && (dnum <= 243 + tack)) { m = 8; rem = dnum - (212 + tack); }
	else if ((dnum > 243 + tack) && (dnum <= 273 + tack)) { m = 9; rem = dnum - (243 + tack); }
	else if ((dnum > 273 + tack) && (dnum <= 304 + tack)) { m = 10; rem = dnum - (273 + tack); }
	else if ((dnum > 304 + tack) && (dnum <= 334 + tack)) { m = 11; rem = dnum - (304 + tack); }
	else { m = 12; rem = dnum - (334 + tack);  }

	return {mo:m, da:rem};

	};





/*
 GET YYYY.MM.DD FROM (serial) rata die 
@param snum is the rata die or day serial number
*/
TGDate.getDateFromRD = function (snum) {
  // in case it arrives as an RD-decimal
  var snumAb = Math.floor(snum);

  var bigP = 146097; // constant days in big cal cycle
  var chunk1 = Math.floor(snumAb / bigP);
  var chunk1days = chunk1 * bigP;
  var chunk1yrs = Math.floor(snumAb / bigP) * 400;
  var chunk2days = snumAb - chunk1days;
  var dechunker = chunk2days; 
  var ct = 1;

  var ia = chunk1yrs + 1;
  var iz = ia + 400;

  for (var i = ia; i <= iz; i++) {
  	if (dechunker > 365) {
  		dechunker -= 365;
  		if (TGDate.isLeapYear(i)) { dechunker -= 1; }
  		ct++;
  	}  else { i = iz; }
  }

	var yt = chunk1yrs + ct;
	
	if (dechunker == 0) dechunker = 1;
	var inf = TGDate.getMonthFromRemDays(dechunker,yt);
	// in case...
	var miLong = (snum - snumAb) * 1440;
	var mi = Math.floor(miLong % 60);
	var ho = Math.floor(miLong / 60);
	
	if ((TGDate.isLeapYear(yt)) && (inf['mo'] == 2)) {
		inf['da'] += 1;
	}

	return yt + "-" + inf['mo'] + "-" + inf['da'] + " " + ho + ":" + ":" + mi + ":00";
	
	// {ye:yt, mo:inf['mo'], da:inf['da'], ho:ho, mi:mi};
	
}, // end getDateFromRD


TGDate.getDateFromSec = function (sec) {
	// FIRST GET Rata die
	var rdDec = sec / 86400; // constant days in big cal cycle
	return TGDate.getDateFromRD(rdDec);
};


TGDate.isLeapYear =  function(y) {
  if (y % 400 == 0) {
    return true;
  } else if (y % 100  == 0){
    return false;
  } else if (y % 4 == 0) {
    return true;
  } else {
    return false;
  }
};



	
	
/*
* getRataDie
* Core "normalizing" function for dates, the serial number day for
* any date, starting with year 1 (well, zero...), wraps a getBCRataDie()
* for getting negative year serial days
*
* @param dat {object} date object with {ye, mo, da}
* @return {number} the serial day
*/
TGDate.getRataDie = function (dat) {
	
	var ye = dat.ye;
	var mo = dat.mo;
	var da = dat.da;
	var ret = 0;

if (ye >= 0) { 
	// THERE IS NO YEAR ZERO!!!
	if (ye == 0) ye = 1;

	var fat =  (Math.floor(ye / 400)) * 146097,
	    remStart = (ye - (ye % 400)),
	    moreDays = parseInt(getDaysInYearSpan(remStart, ye)),
	    daysSoFar = parseInt(getDaysSoFar(mo,ye));
	    
	ret = (fat + moreDays + daysSoFar + da) - 366;
	
} else if (ye < 0) {
	ret = TGDate.getBCRataDie({ye:ye, mo:mo, da:da});
} 

return ret;

////// RataDie functions
    	/*
    	*  used in getRataDie
    	*  a = initial year in span
    	*  z = last year in span
    	## used in getRataDie() to calculate chunks of whole years
    	*/
    	///// MEMOIZE!!!
    function getDaysInYearSpan (a, z) {
  
    	var t = 0;

    	for (var i = a; i < z; i++){
    		if (TGDate.isLeapYear(i)) { t += 366; } else { t += 365; }
    	}

    	return t;

    };


    ///// MEMOIZE!!!
    // used in getRataDie
    function getDaysSoFar (mo,ye) {
    	var d;
	
    	switch (mo) {
    		case 1: d=0;   break; // 31
    		case 2: d=31;  break; // 29
    		case 3: d=59;  break; // 31
    		case 4: d=90;  break; // 30
    		case 5: d=120; break; // 31
    		case 6: d=151; break; // 30
    		case 7: d=181; break; // 31
    		case 8: d=212; break; // 31
    		case 9: d=243; break; // 30
    		case 10: d=273;break; // 31
    		case 11: d=304;break; // 30
    		case 12: d=334;break; // 31
    	}
	
    	if (mo > 2) {
    	   if (TGDate.isLeapYear(ye)) { d += 1; }
    	}

    	return d;
    };


};




/*
Counts serial days starting with -1 in year -1. Visualize a number counting 
from "right to left" on top of the other calendrical pieces chunking away
from "left to right".  But since there's no origin farther back before 0
we have no choice. 

@param dat  object with .ye, .mo, .da
*/
TGDate.getBCRataDie = function (dat) {

	var ye = dat.ye;
	var mo = dat.mo;
	var da = dat.da;

	if (mo == 0) mo = 1;
	if (da == 0) da = 1;

	var absYe = Math.abs(ye);

	var chunks = [0,335,306,275,245,214,184,153,122,92,61,31,0];
	var mdays = TGDate.monthsDayNums[mo];
	var rawYeDays = (absYe - 1) * 366;
	var rawMoDays = chunks[mo];
	var rawDaDays = (mdays - da) + 1;
	return -1 * (rawYeDays + rawMoDays + rawDaDays);
};


	
TGDate.monthNamesFull = ["","January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
TGDate.monthNamesAbbr = ["","Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
TGDate.monthsDayNums = [0,31,28,31,30,31,30,31,31,30,31,30,31,29];
TGDate.monthNamesLet = ["","J","F","M","A","M","J","J","A","S","O","N","D"];
TGDate.dayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
TGDate.dayNamesAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
TGDate.dayNamesLet = ["S", "M", "T", "W", "T", "F", "S"];
TGDate.units = ["da", "mo", "ye", "de", "ce", "thou", "tenthou", "hundredthou", "mill", "tenmill", "hundredmill", "bill"];



TGDate.prototype = {
    
    formatFocusDate : function () {
  	  return this.ye + "-" + this.mo + "-" + this.da + " " + this.ho + ":" + this.mi + ":00";
    },
    
    
    format : function (sig) {
      // get universal formats from jquery.glob
      var ret = "";
      switch(sig) {
        case "YYYY-MM-DD": ret = this.ye + "-" + this.mo + "-" + this.da; break;
        case "YYYY": ret = this.ye; break;
        default: ret = this.ye + "-" + this.mo + "-" + this.da + " " + this.ho + ":" + this.mi + ":00";
      }
      
      return ret;
      
    }
  
  
}
})(timeglider);


