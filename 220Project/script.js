document.addEventListener("DOMContentLoaded", async function () {
    const loggedInUser = localStorage.getItem("loggedInUser") || "Guest";
    const blogContainer = document.getElementById("blog-container");
    const loadMoreButton = document.getElementById("load-more-btn");
    let visiblePosts = 3;
    let allPosts = [];

    if (document.getElementById("post-form")) {
        setupPostForm();
    }

    async function processJSON() {
        try {
            let response = await fetch('https://jsonblob.com/api/jsonBlob/1349097345740103680');
            if (!response.ok) throw new Error("Failed to fetch data");
            
            let posts = await response.json();
            let savedPosts = JSON.parse(localStorage.getItem("posts")) || [];
            allPosts = [...savedPosts, ...posts];
            
            loadPostCards(visiblePosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            blogContainer.innerHTML = "<p>Failed to load posts. Please try again later.</p>";
        }
    }

    function loadPostCards(limit) {
        blogContainer.innerHTML = "";
        allPosts.slice(0, limit).forEach((post) => {
            const postElement = document.createElement("div");
            postElement.classList.add("col-md-4", "col-sm-6", "mb-4", "blog-post");
            postElement.setAttribute("data-category", post.game);
            
            postElement.innerHTML = `
                <div class="tf-card-box">
                    ${post.poster === loggedInUser ? '<button class="edit-btn">Edit</button>' : ''}
                    <div class="card-media">
                        <img src="${post.image}" alt="Post Image">
                    </div>
                    <div class="meta-info text-center">
                        <h5 class="name">${post.post}</h5>
                        <div class="author flex items-center">
                            <div class="avatar"><img src="${post.avatar}" alt="Profile Picture"></div>
                            <div class="info">
                                <span>Created by:</span>
                                <h6>${post.poster}</h6>
                            </div>
                        </div>
                        <button class="read-more-btn">Read More</button>
                        <button class="delete-btn btn-danger">Delete</button>
                    </div>
                </div>`;
            
            blogContainer.appendChild(postElement);
        });

        loadMoreButton.style.display = (visiblePosts >= allPosts.length) ? "none" : "block";
        addDeleteFunctionality();
        addEditFunctionality();
        addReadMoreFunctionality();
    }

    function addDeleteFunctionality() {
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", function () {
                const postTitle = this.closest(".blog-post").querySelector("h5").textContent;
                let savedPosts = JSON.parse(localStorage.getItem("posts")) || [];
                savedPosts = savedPosts.filter(post => post.post !== postTitle);
                localStorage.setItem("posts", JSON.stringify(savedPosts));
                this.closest(".blog-post").remove();
            });
        });
    }
    function addReadMoreFunctionality() {
        document.querySelectorAll(".read-more-btn").forEach(button => {
            button.addEventListener("click", function () {
                const postTitle = this.getAttribute("data-id");
                localStorage.setItem("selectedPost", postTitle);
                window.location.href = "post-detail.html"; // Navigate to the detail page
            });
        });
    }

    function addEditFunctionality() {
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", function () {
                const postElement = this.closest(".blog-post");
                const postTitle = postElement.querySelector("h5").textContent;
                let savedPosts = JSON.parse(localStorage.getItem("posts")) || [];
                let postIndex = savedPosts.findIndex(post => post.post === postTitle);
                if (postIndex === -1) return;
                
                let post = savedPosts[postIndex];
                postElement.innerHTML = `
                    <div class="tf-card-box">
                        <div class="card-media">
                            <img src="${post.image}" alt="Post Image">
                        </div>
                        <div class="meta-info text-center">
                            <input type="text" id="edit-title" value="${post.post}" class="form-control">
                            <textarea id="edit-content" class="form-control">${post.content || ""}</textarea>
                            <button class="save-edit-btn btn-success">Save</button>
                            <button class="cancel-edit-btn btn-secondary">Cancel</button>
                        </div>
                    </div>`;
                
                postElement.querySelector(".save-edit-btn").addEventListener("click", function () {
                    post.post = document.getElementById("edit-title").value;
                    post.content = document.getElementById("edit-content").value;
                    savedPosts[postIndex] = post;
                    localStorage.setItem("posts", JSON.stringify(savedPosts));
                    loadPostCards(visiblePosts);
                });

                postElement.querySelector(".cancel-edit-btn").addEventListener("click", function () {
                    loadPostCards(visiblePosts);
                });
            });
        });
    }

    if (loadMoreButton) {
        loadMoreButton.addEventListener("click", function () {
            visiblePosts += 3;
            loadPostCards(visiblePosts);
        });
    }

    function setupPostForm() {
        const postForm = document.getElementById("post-form");
        if (!postForm) {
            console.error("Form not found!");
            return;
        }

        postForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const usergame = document.getElementById("category-select").value;
            const imageuser = "Images/Profilepics/image18.jpeg";
            const title = document.getElementById("post-title").value;
            const content = document.getElementById("post-content").value;
            const username = localStorage.getItem("loggedInUser") || "Guest";
            const defaultAvatar = localStorage.getItem("userAvatar") || "Images/Profilepics/image23.jpeg";

            if (!title || !content) {
                alert("Please fill in all fields.");
                return;
            }

            const newPost = {
                image: imageuser,
                game: usergame,
                post: title,
                poster: username,
                avatar: defaultAvatar,
                datacategory: usergame,
                content: content
            };

            let posts = JSON.parse(localStorage.getItem("posts")) || [];
            posts.unshift(newPost);
            localStorage.setItem("posts", JSON.stringify(posts));

     axios.put('https://jsonblob.com/api/jsonBlob/1349097345740103680', posts)
    .then(function(response) {
        console.log('Post updated:', response.data);
    
    })
    .catch(function(error) {
        console.error('Error:', error);
        alert("An error occurred while updating the post.");
    });
        window.location.href = "Gallery.html"; 
        });
    }

    processJSON();
});

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault(); 
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const validUsers = {
        "guest": "guest123"
    };

    if (validUsers[username] && validUsers[username] === password) {
        alert("Login successful! Redirecting...");
        localStorage.setItem("loggedInUser", username);
        window.location.href = "Index.html"; 
    } else {
        document.getElementById("error-message").textContent = "Invalid username or password!";
    }
});
