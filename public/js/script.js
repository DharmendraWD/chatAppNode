let flag = 1;
let barsParent = document.querySelector(".bars")


barsParent.addEventListener("click", (elem)=>{
    let bar = document.querySelectorAll(".bar")
    let onlineuserslist = document.querySelector("#online-users-list");
    let chatContainer = document.querySelector("#chatContainer");
if(flag ===1){
        bar[1].style.display = "none";
        bar[0].style.transform = "rotate(45deg)";
        bar[2].style.transform = "rotate(135deg)";
        bar[2].style.position = "relative";
        bar[2].style.bottom = "8px";
        flag = 0;
     onlineuserslist.style.display="block";
     chatContainer.classList.add("blur");
    }
    else{
        bar[1].style.display = "block";
        bar[0].style.transform = "rotate(0deg)";
        bar[2].style.transform = "rotate(0deg)";
        bar[2].style.position = "relative";
        bar[2].style.bottom = "0px";
        onlineuserslist.style.display="none" 
        chatContainer.classList.remove("blur");
        flag = 1;
} 
})