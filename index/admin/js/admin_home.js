const links = document.querySelectorAll(".side-nav a");

links.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default link behavior (optional)

    // Remove the "clicked" class from all links
    links.forEach((otherLink) => {
      otherLink.classList.remove("clicked");
    });

    // Add the "clicked" class to the clicked link
    link.classList.add("clicked");
  });
});

function loadContent(contentId) {
  // Hide all content divs
  const contentDivs = document.querySelectorAll(".content > div");
  contentDivs.forEach((div) => {
    div.style.display = "none";
  });

  // Show the selected content
  document.getElementById(contentId).style.display = "block";
}
// Set the "Home" link to be lit up by default
const homeLink = document.querySelector(".side-nav a[href='#']");
homeLink.classList.add("clicked");
loadContent("dashboard");
