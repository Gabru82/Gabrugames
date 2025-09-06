document.addEventListener("DOMContentLoaded", () => {
  const boxes = [
    document.getElementById("box"),
    document.getElementById("box1"),
    document.getElementById("box2"),
    document.getElementById("box3"),
    document.getElementById("box4"),
    document.getElementById("box5"),
    document.getElementById("box6"),
    document.getElementById("box7")
  ];

  const icons = [
    document.getElementById("icon"),
    document.getElementById("icon1"),
    document.getElementById("icon2"),
    document.getElementById("icon3"),
    document.getElementById("icon4"),
    document.getElementById("icon5"),
    document.getElementById("icon6"),
    document.getElementById("icon7")
  ];

  const gameButtons = [
    { buttonId: "Lottery", boxIndex: 0, iconIndex: 0 },
    { buttonId: "Mini", boxIndex: 1, iconIndex: 1 },
    { buttonId: "Hot", boxIndex: 2, iconIndex: 2 },
    { buttonId: "Slots", boxIndex: 3, iconIndex: 3 },
    { buttonId: "Fishing", boxIndex: 4, iconIndex: 4 },
    { buttonId: "PVC", boxIndex: 5, iconIndex: 5 },
    { buttonId: "Casino", boxIndex: 6, iconIndex: 6 },
    { buttonId: "Sports", boxIndex: 7, iconIndex: 7 }
  ];

  gameButtons.forEach(({ buttonId, boxIndex, iconIndex }) => {
    const button = document.getElementById(buttonId);
    button.addEventListener("click", () => {
      // Show only the selected box
      boxes.forEach((box, i) => {
        box.style.display = i === boxIndex ? "block" : "none";
      });

      // Set background of all icons
      icons.forEach((icon, i) => {
        icon.style.background = i === iconIndex ? "url('/images/icon_bg.webp')" : "url('/images/fishing/icon_bg-bulu.webp')";
        icon.style.backgroundSize = "cover";
      });
    });
  });
});
