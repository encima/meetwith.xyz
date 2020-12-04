interface Calendar {
  id?: number;
  url?: string;
  alias?: string;
  name?: string;
  group?:string;
}

class CalDatabase extends Dexie {


}

function openIndexed(name) {
    return 
  }

  function putLocal(key, data) {
    if (typeof data != "string") {data = JSON.stringify(data);}
    localStorage.setItem(key, data)
  }

  function getLocal(key) {
    return JSON.parse(localStorage.getItem(key));
  }


  