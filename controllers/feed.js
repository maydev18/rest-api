const {validationResult} = require("express-validator");
const fs = require("fs");
const path = require("path");
const Post = require("../model/post");

const User = require("../model/user");
exports.getPosts = (req , res , next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    Post.find().countDocuments()
    .then(number => {
        totalItems = number;
        return Post.find().skip((currentPage-1)*perPage).limit(perPage);
    })
    .then(posts => {
        res.status(200).json({
            message : "Posts fetched successfully",
            posts : posts,
            totalItems : totalItems
        })
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
};

exports.postPost = (req , res , next) => {
    const errors = validationResult(req);
    let creator;
    if(!errors.isEmpty()){
        const error = new Error("Validation failed, entered data is incorrect");
        error.statusCode = 422;
        throw error;
    }
    if(!req.file){
        const err = new Error("no image provided");
        err.statusCode = 422;
        throw err;
    }
    const imageUrl = req.file.path.replace("\\","/");
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title : title,
        content : content,
        creator : req.userId,
        imageUrl : imageUrl
    })
    post.save()
    .then(post => {
        return User.findById(req.userId);
    })
    .then(user => {
        creator = user;
        user.posts.push(post);
        return user.save();
    })
    .then(result => {
        res.status(201).json({   
            message : "Post created successfully",
            post : post,
            creator : {
                _id : creator._id,
                name : creator.name
            }
        });
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
    
};

exports.getPost = (req ,res , next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error("No posts found");
            error.statusCode = 404;
            //this throw will be caught by the catch block
            throw error;
        }
        res.status(200).json({
            message : "Post fetched",
            post : post
        });
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.updatePost = (req , res , next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error("Validation failed, entered data is incorrect");
        error.statusCode = 422;
        throw error;
    }
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if(req.file){
        imageUrl = req.file.path;
    }
    if(!imageUrl){
        const error = new Error("no file picked");
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error("No posts found");
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== req.userId){
            const error = new Error("Not authorized");
            error.statusCode = 403;
            throw error;
        }
        if(imageUrl !== post.imageUrl){
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl.replace("\\" , "/");
        post.content = content;
        return post.save();
    })
    .then(result => {
        res.status(200).json({
            message : "Post Updated",
            post : result
        })
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}


exports.deletePost = (req , res , next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        
        if(!post){
            const error = new Error("No posts found");
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== req.userId){
            const error = new Error("Not authorized");
            error.statusCode = 403;
            throw error;
        }
        //check logging user
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
    })
    .then(result => {
        return User.findById(req.userId);
    })
    .then(user => {
        user.posts.pull(postId);
        user.save();
    })
    .then(result => {
        res.status(200).json({
            message : "post is deleted"
        })
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}
const clearImage = filePath => {
    filePath = path.join(__dirname , ".." , filePath);
    fs.unlink(filePath , err => {
        console.log(err);
    })
}