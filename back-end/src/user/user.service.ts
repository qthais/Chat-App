import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User } from './user.type';
import path from 'path';
import fs from 'fs'

@Injectable()
export class UserService {
    constructor(
        private readonly prisma:PrismaService
    ){}
    async updateProfile(userId:number, fullname:string, avatarUrl:string):Promise<User>{
        if(avatarUrl){
            const oldUser= await this.prisma.user.findUnique({
                where:{id:userId}
            })
            const updatedUser= await this.prisma.user.update({
                where:{id:userId},
                data:{
                    fullname,
                    avatarUrl
                }
            })
            //delete old avatar of user and replace
            if(oldUser.avatarUrl){
                const imageName=oldUser.avatarUrl.split('/').pop()
                const imagePath=path.join(__dirname,'..','..','publics','images',imageName)
                if(fs.existsSync(imagePath)){
                    fs.unlinkSync(imagePath)
                }
            }
            return updatedUser
        }
        return await this.prisma.user.update({
            where:{id:userId},
            data:{
                fullname,
            }
        })
    }
}
