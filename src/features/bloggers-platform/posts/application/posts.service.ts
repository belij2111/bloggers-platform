import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/posts.repository';
import { PostCreateModel } from '../api/models/input/create-post.input.model';
import { Post } from '../domain/post.entity';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
import { LikeInputModel } from '../../likes/api/models/input/like.input.model';
import { LikesRepository } from '../../likes/infrastructure/likes.repository';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { Like, LikeStatus } from '../../likes/domain/like.entity';
import { LikesInfoModel } from '../../likes/api/models/input/likes.info.model';
import { User } from '../../../users/domain/user.entity';
import { LikeDetailsModel } from '../../likes/api/models/input/like.details.model';
import { ExtendedLikesInfoModel } from '../api/models/input/extended.likes.info.model';

@Injectable()
export class PostsService {
  constructor(
    private readonly postRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
    private readonly likesRepository: LikesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(postCreateModel: PostCreateModel): Promise<{ id: string }> {
    const foundBlog = await this.blogsRepository.findByIdOrNotFoundFail(
      postCreateModel.blogId,
    );
    const newPostDto: Post = {
      title: postCreateModel.title,
      shortDescription: postCreateModel.shortDescription,
      content: postCreateModel.content,
      blogId: foundBlog.id,
      blogName: foundBlog.name,
      createdAt: new Date(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: [],
      },
    };
    return await this.postRepository.create(newPostDto);
  }

  async delete(id: string): Promise<boolean> {
    const foundPost = await this.postRepository.findByIdOrNotFoundFail(id);
    return this.postRepository.delete(foundPost.id);
  }

  async update(
    id: string,
    postUpdateModel: PostCreateModel,
  ): Promise<boolean | null> {
    const foundPost = await this.postRepository.findByIdOrNotFoundFail(id);
    const updatedPostDto: PostCreateModel = {
      title: postUpdateModel.title,
      shortDescription: postUpdateModel.shortDescription,
      content: postUpdateModel.content,
      blogId: postUpdateModel.blogId,
    };
    return await this.postRepository.update(foundPost, updatedPostDto);
  }

  async createPostByBlogId(
    blogId: string,
    postCreateModel: PostCreateModel,
  ): Promise<{ id: string }> {
    const foundBlog = await this.blogsRepository.findByIdOrNotFoundFail(blogId);
    const newPostDto: Post = {
      title: postCreateModel.title,
      shortDescription: postCreateModel.shortDescription,
      content: postCreateModel.content,
      blogId: foundBlog.id,
      blogName: foundBlog.name,
      createdAt: new Date(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: [],
      },
    };
    return await this.postRepository.create(newPostDto);
  }

  async updateLikeStatus(
    currentUserId: string,
    postId: string,
    likeInputModel: LikeInputModel,
  ) {
    const foundPost = await this.postRepository.findByIdOrNotFoundFail(postId);
    const foundUser =
      await this.usersRepository.findByIdOrNotFoundFail(currentUserId);
    const foundLike = await this.likesRepository.find(currentUserId, postId);
    let likesInfo: any;
    if (foundLike) {
      const likesInfoModel: LikesInfoModel = {
        currentStatus: foundLike.status,
        likesCount: foundPost.extendedLikesInfo.likesCount,
        dislikesCount: foundPost.extendedLikesInfo.dislikesCount,
      };
      likesInfo = this.updateCounts(likeInputModel.likeStatus, likesInfoModel);
      const updatedNewestLikes: LikeDetailsModel[] = this.updateNewestLikes(
        foundPost,
        currentUserId,
        foundUser,
        likeInputModel,
      );
      const sortedNewestLikes = this.sortNewestLikes(updatedNewestLikes);
      const updatedLikesInfoPostModel: ExtendedLikesInfoModel = {
        extendedLikesInfo: {
          likesCount: likesInfo.likesCount,
          dislikesCount: likesInfo.dislikesCount,
          myStatus: likeInputModel.likeStatus,
          newestLikes: sortedNewestLikes,
        },
      };
      await this.likesRepository.update(foundLike, likeInputModel);
      return await this.postRepository.update(
        foundPost,
        updatedLikesInfoPostModel,
      );
    }
    const likeModel: Like = {
      createdAt: new Date(),
      status: likeInputModel.likeStatus,
      authorId: currentUserId,
      parentId: postId,
    };
    await this.likesRepository.create(likeModel);
    const likesInfoModel: LikesInfoModel = {
      currentStatus: LikeStatus.None,
      likesCount: foundPost.extendedLikesInfo.likesCount,
      dislikesCount: foundPost.extendedLikesInfo.dislikesCount,
    };
    likesInfo = this.updateCounts(likeInputModel.likeStatus, likesInfoModel);
    const updatedNewestLikes: LikeDetailsModel[] = this.updateNewestLikes(
      foundPost,
      currentUserId,
      foundUser,
      likeInputModel,
    );
    const sortedNewestLikes = this.sortNewestLikes(updatedNewestLikes);
    const updatedLikesInfoPostModel: ExtendedLikesInfoModel = {
      extendedLikesInfo: {
        likesCount: likesInfo.likesCount,
        dislikesCount: likesInfo.dislikesCount,
        myStatus: likeInputModel.likeStatus,
        newestLikes: sortedNewestLikes,
      },
    };
    return await this.postRepository.update(
      foundPost,
      updatedLikesInfoPostModel,
    );
  }

  private updateCounts(newStatus: string, likesInfoModel: LikesInfoModel) {
    let { likesCount, dislikesCount } = likesInfoModel;
    const currentStatus = likesInfoModel.currentStatus;
    if (newStatus === currentStatus) {
      return { likesCount, dislikesCount };
    }
    switch (newStatus) {
      case LikeStatus.Like:
        if (currentStatus === LikeStatus.None) {
          likesCount++;
        } else if (currentStatus === LikeStatus.Dislike) {
          likesCount++;
          dislikesCount--;
        }
        break;
      case LikeStatus.Dislike:
        if (currentStatus === LikeStatus.None) {
          dislikesCount++;
        } else if (currentStatus === LikeStatus.Like) {
          likesCount--;
          dislikesCount++;
        }
        break;
      case LikeStatus.None:
        if (currentStatus === LikeStatus.Like) {
          likesCount--;
        } else if (currentStatus === LikeStatus.Dislike) {
          dislikesCount--;
        }
        break;
    }
    return { likesCount, dislikesCount };
  }

  private updateNewestLikes(
    foundPost: Post,
    userId: string,
    foundUser: User,
    inputLike: LikeInputModel,
  ) {
    const updatedNewestLikes: LikeDetailsModel[] =
      foundPost.extendedLikesInfo.newestLikes.filter(
        (el) => el.userId !== userId,
      );
    if (inputLike.likeStatus === LikeStatus.Like) {
      const likeDetailsModel: LikeDetailsModel = {
        addedAt: new Date(),
        userId: userId,
        login: foundUser.login,
      };
      updatedNewestLikes.push(likeDetailsModel);
    }
    return updatedNewestLikes;
  }

  private sortNewestLikes(updatedNewestLikes: LikeDetailsModel[]) {
    return updatedNewestLikes
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      .slice(0, 3);
  }
}
