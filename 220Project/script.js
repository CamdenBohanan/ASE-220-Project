document.addEventListener("DOMContentLoaded", async function () {
    const loggedInUser = localStorage.getItem("Guest");
    const blogContainer = document.getElementById("blog-container");
    const loadMoreButton = document.getElementById("load-more-btn");
    let visiblePosts = 6;
    let allPosts = [];

    if (document.getElementById("post-form")) {
        setupPostForm();
    }

    async function processJSON() {
        try {
            const response = await fetch('https://jsonblob.com/api/jsonBlob/1367682705415921664');
            const posts = await response.json();
            allPosts = posts;
            localStorage.setItem("posts", JSON.stringify(posts));
            loadPostCards(visiblePosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            if (blogContainer) {
                blogContainer.innerHTML = "<p>Failed to load posts. Please try again later.</p>";
            }
        }
    }
    processJSON(); // Initial load

    function loadPostCards(limit) {
        if (!blogContainer) return;
        blogContainer.innerHTML = "";
        allPosts.slice(0, limit).forEach((post) => {
            const postElement = document.createElement("div");
            postElement.classList.add("col-md-4", "col-sm-6", "mb-4", "blog-post");
            postElement.setAttribute("data-category", post.game);
            
            postElement.innerHTML = `
                <div class="tf-card-box">
                    ${post.poster === loggedInUser ? '<button class="edit-btn">Edit</button>' : ''}
                    <div class="card-media contain">
                        <div class="picture">
                            <img src="${post.image}" alt="Post Image">
                        </div>
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
                        <button class="read-more-btn" data-id="${post.post}">Read More</button>
                        <button class="delete-btn btn-danger">Delete</button>
                    </div>
                </div>`;
            
            blogContainer.appendChild(postElement);
        });

        if (loadMoreButton) {
            loadMoreButton.style.display = (visiblePosts >= allPosts.length) ? "none" : "block";
        }

        addDeleteFunctionality();
        addEditFunctionality();
        addReadMoreFunctionality();
        setupPostForm();
    }

    function addDeleteFunctionality() {
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const postElement = this.closest(".blog-post");
                const postTitle = postElement.querySelector("h5").textContent;
                let savedPosts = JSON.parse(localStorage.getItem("posts")) || [];
    
                savedPosts = savedPosts.filter(post => post.post !== postTitle);
                localStorage.setItem("posts", JSON.stringify(savedPosts));
    
                try {
                    await updatePost(savedPosts);  
                    console.log('Post deleted successfully');
                    postElement.remove();
                } catch (error) {
                    console.error('Error updating the server after deletion:', error);
                    alert("Failed to delete the post. Please try again.");
                }
            });
        });
    }
    

    function addReadMoreFunctionality() {
        document.querySelectorAll(".read-more-btn").forEach(button => {
            button.addEventListener("click", function () {
                const postTitle = this.getAttribute("data-id");
                localStorage.setItem("selectedPost", postTitle);
                window.location.href = "post-detail.html";
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
                            <button class="save-edit-btn btn-success">Save</button>
                            <button class="cancel-edit-btn btn-secondary">Cancel</button>
                        </div>
                    </div>`;

                postElement.querySelector(".save-edit-btn").addEventListener("click", function () {
                    post.post = document.getElementById("edit-title").value;
                    savedPosts[postIndex] = post;
                    localStorage.setItem("posts", JSON.stringify(savedPosts));

                    axios.put('https://jsonblob.com/api/jsonBlob/1367682705415921664', savedPosts)
                        .then(() => loadPostCards(visiblePosts))
                        .catch(error => console.error('Error saving edit:', error));
                });

                postElement.querySelector(".cancel-edit-btn").addEventListener("click", function () {
                    loadPostCards(visiblePosts);
                });
            });
        });
    }

    if (loadMoreButton) {
        loadMoreButton.addEventListener("click", function () {
            visiblePosts += 6;
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
            const username = localStorage.getItem("Guest");  
            const defaultAvatar = "Images/Profilepics/image23.jpeg";  
    
            
            if (!title) {
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
            };
    
            
            let posts = JSON.parse(localStorage.getItem("posts")) || [];
    
            
            posts.unshift(newPost);  
    
            
            localStorage.setItem("posts", JSON.stringify(posts));
    

            updatePost(posts) 
                .then(() => {
                    
                    window.location.href = "Gallery.html";
                })
                .catch((error) => {
                    console.error('Error updating post to JSONBlob:', error);
                    alert("An error occurred while saving the post.");
                });
        });
    }
    
    async function updatePost(updatedPosts) {
        try {
            const response = await fetch('https://jsonblob.com/api/jsonBlob/1367682705415921664', {
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json', 
                },
                body: JSON.stringify(updatedPosts), 
            });
    
            if (response.ok) {
                const updatedData = await response.json();
                console.log('Posts updated successfully:', updatedData);
                localStorage.setItem("posts", JSON.stringify(updatedData)); 
            } else {
                throw new Error('Failed to update posts');
            }
        } catch (error) {
            console.error('Error updating posts:', error);
            alert("Failed to update posts. Please try again.");
        }
    }
    

    
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
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
    }


    
});



