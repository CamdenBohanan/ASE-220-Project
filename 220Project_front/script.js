document.addEventListener("DOMContentLoaded", async function () {
    const loggedInUser = localStorage.getItem("loggedInUser");
    const blogContainer = document.getElementById("blog-container");
    const loadMoreButton = document.getElementById("load-more-btn");
    let visiblePosts = 6;
    let allPosts = [];

    if (document.getElementById("post-form")) {
        setupPostForm();
    }

    async function fetchData(url, key) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log(`Fetched ${key}:`, data);
            localStorage.setItem(key, JSON.stringify(data));
            return data;
        } catch (error) {
            console.error(`Error fetching ${key}:`, error);
            if (blogContainer) {
                blogContainer.innerHTML = `<p>Failed to load ${key.toLowerCase()}.</p>`;
            }
            return [];
        }
    }

    async function initializeData() {
        allPosts = await fetchData("http://localhost:3000/Posts", "posts");
        await fetchData("http://localhost:3000/Comments", "Comments");
        await fetchData("http://localhost:3000/Users", "Users");

        loadPostCards(visiblePosts);
        if (document.getElementById("post-title")) {
            loadDetailedPage();
            setupCommentForm();
        }
    }

    initializeData();

    function loadPostCards(limit) {
        if (!blogContainer) return;
        blogContainer.innerHTML = "";
        const users = JSON.parse(localStorage.getItem("Users")) || [];

        allPosts.slice(0, limit).forEach((post) => {
            const postUser = users.find(u => u.username === post.poster);
            const userId = postUser?._id || "";

            const postElement = document.createElement("div");
            postElement.classList.add("col-md-4", "col-sm-6", "mb-4", "blog-post");
            postElement.setAttribute("data-id", post._id);
            postElement.setAttribute("data-user-id", userId);
            postElement.setAttribute("data-category", post.game);
            postElement.setAttribute("IDtag", post.id);

            postElement.innerHTML = `
                <div class="tf-card-box1">
                    ${post.poster === loggedInUser ? '<button class="edit-btn">Edit</button>' : ''}
                    <div class="card-media contain card-media-gallery">
                        <div class="picture">
                            <img src="${post.image}" alt="Post Image">
                        </div>
                    </div>
                    <div class="meta-info text-center">
                        <h5 class="name">${post.post}</h5>
                        <div class="author flex items-center">
                            <div class="avatar"><img src="${post.avatar}" class="Profile-clicker" data-user-id="${userId}" alt="Profile Picture"></div>
                            <div class="info">
                                <span>Created by:</span>
                                <h6>${post.poster}</h6>
                            </div>
                        </div>
                        <button class="read-more-btn" data-id="${post._id}" data-user-id="${userId}" data-idtag="${post.id}">Read More</button>
                        <button class="delete-btn btn-danger">Delete</button>
                    </div>
                </div>`;

            blogContainer.appendChild(postElement);
        });

        if (loadMoreButton) {
            loadMoreButton.style.display = (visiblePosts >= allPosts.length) ? "none" : "block";
        }

        document.querySelectorAll(".Profile-clicker").forEach(element => {
            element.addEventListener("click", function () {
                const userId = this.getAttribute("data-user-id");
                if (userId) {
                    localStorage.setItem("selectedUserId", userId);
                    window.location.href = "Useraccount.html";
                }
            });
        });

        addDeleteFunctionality();
        addEditFunctionality();
        addReadMoreFunctionality();
    }

    function addDeleteFunctionality() {
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async function () {
                const postElement = this.closest(".blog-post");
                const postId = postElement.getAttribute("data-id");
    
                try {
                    await fetch(`http://localhost:3000/Posts/${postId}`, { method: 'DELETE' });
                    console.log('Post deleted successfully');
                    allPosts = allPosts.filter(post => post._id !== postId);
                    localStorage.setItem("posts", JSON.stringify(allPosts)); 
                    if (loadMoreButton && visiblePosts > allPosts.length) {
                        loadMoreButton.style.display = "none";
                    }
                } catch (error) {
                    console.error('Error deleting post:', error);
                    alert("Failed to delete the post. Please try again.");
                }
            });
        });
    }

    function addReadMoreFunctionality() {
        document.querySelectorAll(".read-more-btn").forEach(button => {
            button.addEventListener("click", function () {
                const postId = this.getAttribute("data-id");
                const userId = this.getAttribute("data-user-id");
                const idTag = this.getAttribute("data-idtag");

                localStorage.setItem("selectedPostId", postId);
                localStorage.setItem("selectedUserId", userId);
                localStorage.setItem("IDtag", idTag);
                window.location.href = "Detail.html";
            });
        });
    }

    function addEditFunctionality() {
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", function () {
                const postElement = this.closest(".blog-post");
                const postId = postElement.getAttribute("data-id");
                const savedPosts = JSON.parse(localStorage.getItem("posts")) || [];
                const postToEdit = savedPosts.find(post => post._id === postId);

                if (!postToEdit) {
                    console.warn(`Post with ID ${postId} not found.`);
                    return;
                }

                postElement.innerHTML = `
                    <div class="tf-card-box1">
                        <div class="card-media">
                            <img src="${postToEdit.image}" alt="Post Image">
                        </div>
                        <div class="meta-info text-center">
                            <input type="text" id="edit-title" value="${postToEdit.post}" class="form-control">
                            <button class="save-edit-btn btn-success" data-id="${postId}">Save</button>
                            <button class="cancel-edit-btn btn-secondary">Cancel</button>
                        </div>
                    </div>`;

                postElement.querySelector(".save-edit-btn").addEventListener("click", function () {
                    const newTitle = document.getElementById("edit-title").value;

                    updateSinglePost(postId, { post: newTitle })
                        .then(updatedPost => {
                            allPosts = allPosts.map(post => post._id === postId ? updatedPost : post);
                            localStorage.setItem("posts", JSON.stringify(allPosts));
                            loadPostCards(visiblePosts);
                        })
                        .catch(error => console.error('Error saving edit:', error));
                });

                postElement.querySelector(".cancel-edit-btn").addEventListener("click", function () {
                    loadPostCards(visiblePosts);
                });
            });
        });
    }

    async function updateSinglePost(postId, updatedData) {
        const response = await fetch(`http://localhost:3000/Posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to update post: ${error.message}`);
        }

        return await response.json();
    }

    async function updatePost(posts) {
        for (const post of posts) {
            await updateSinglePost(post._id, post);
        }
    }

    if (loadMoreButton) {
        loadMoreButton.addEventListener("click", function () {
            visiblePosts += 6;
            loadPostCards(visiblePosts);
        });
    }

    async function createPost(newPostData) {
        const response = await fetch('http://localhost:3000/Posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPostData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create post: ${error.message}`);
        }

        return await response.json();
    }
    createComment(newComment)
    .then(savedComment => {
        const comments = JSON.parse(localStorage.getItem("Comments")) || [];
        comments.push(savedComment);
        localStorage.setItem("Comments", JSON.stringify(comments));
        loadCommentsForPost(); 
        commentForm.reset(); 
    })
    .catch(error => {
        console.error("Error posting comment:", error);
        alert("Failed to post comment.");
    });


    function setupPostForm() {
        const postForm = document.getElementById("post-form");
        if (!postForm) return;

        postForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const usergame = document.getElementById("category-select").value;
            const imageuser = "Images/Profilepics/image18.jpeg";
            const title = document.getElementById("post-title").value;
            const username = localStorage.getItem("Guest");
            const defaultAvatar = "Images/Profilepics/image23.jpeg";
            const userpost = document.getElementById("post-content").value;

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
                description: userpost,
                id: getRandomHexColor(),
            };

            createPost(newPost)
                .then(() => {
                    window.location.href = "Gallery.html";
                })
                .catch(error => alert(error.message));
        });
    }

    function loadDetailedPage() {
        const selectedPostId = localStorage.getItem("selectedPostId");
        const posts = JSON.parse(localStorage.getItem("posts")) || [];
        const post = posts.find(p => p._id === selectedPostId);

        if (!post) {
            document.body.innerHTML = "<p class='compstext'>Post not found.</p>";
            return;
        }

        document.getElementById("post-title").textContent = post.post;
        document.getElementById("post-author").textContent = `Created by: ${post.poster}`;
        document.getElementById("post-image").src = post.image;
        document.getElementById("post-avatar").src = post.avatar;
        document.getElementById("post-description_content").textContent = post.description;

        loadCommentsForPost();
    }

    function loadCommentsForPost() {
        const IDtag = localStorage.getItem("IDtag");
        const comments = JSON.parse(localStorage.getItem("Comments")) || [];
        const commentContainer = document.getElementById("comment-container");

        if (!commentContainer) return;

        const postComments = comments.filter(comment => comment.id === IDtag);
        commentContainer.innerHTML = postComments.length
            ? postComments.map(comment => `
                <div class="comment">
                    <h5 class="name">${comment.username}</h5>
                    <div class="author flex items-center">
                        <div class="avatar"><img src="${comment.profilepic}" alt="Profile Picture"></div>
                        <div class="info">
                            <h6>${comment.comment}</h6>
                        </div>
                    </div>
                </div>`).join("")
            : "<p>No comments yet.</p>";
    }
    function setupCommentForm() {
        const commentForm = document.getElementById("comment_form");
        if (!commentForm) return;
    
        commentForm.addEventListener("submit", async function (event) {
            event.preventDefault();
    
            const IDtag = localStorage.getItem("IDtag");
            const username = localStorage.getItem("Guest");
            const defaultAvatar = "Images/Profilepics/image23.jpeg";
            const commentPost = document.getElementById("comment-content").value;
    
            if (!commentPost) {
                alert("Please enter a comment.");
                return;
            }
    
            const newComment = {
                id: IDtag,
                username: username,
                profilepic: defaultAvatar,
                comment: commentPost,
            };
    
            createComment(newComment);
            
              
        
        });
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

            if (validUsers[username] === password) {
                alert("Login successful! Redirecting...");
                localStorage.setItem("loggedInUser", username);
                window.location.href = "Index.html";
            } else {
                document.getElementById("error-message").textContent = "Invalid username or password!";
            }
        });
    }
    function getRandomHexColor() {
        const hex = Math.floor(Math.random() * 0xffffff).toString(16);
        return `#${hex.padStart(6, '0')}`;
      }
      
});
