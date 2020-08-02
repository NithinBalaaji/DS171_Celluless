
// Importing config/env variables

// Importing models
const Workflow = require("../models/workflow");
const Group = require("../models/group");
const path = require('path');
const fs = require('fs');

//Importing utils
const Uploader = require('../utils/upload');

exports.listWorkflow = async (req, res) => {
    try {
        let workflows = await Workflow.find().populate({
            path: 'approvers.grp',
            populate: {
                path: 'members'
            }
        }).exec();
        // workflows.forEach(async workflow => {
        //     const templateEjs = await fs.readFileSync(path.join('../uploads', workflow.path), 'utf8');
        //     workflow.templateEjs = templateEjs;
        // });
        return res.render('listWorkflow', { workflows });
    } catch (error) {
        console.log(error);
    }
}

exports.renderCreateWorkflow = async (req, res) => {
    try {
        let groups = await Group.find({});
        return res.render('createWorkflow', {groups});
    } catch (error) {
        throw error;
    }
}

exports.createWorkflow = async (req, res) => {
    try {
        console.log(req.body);
        let fieldName = 'template';
        const fileOptions = {
            fileName: 'template',
            fieldName: fieldName,
            allowedFileSize : 3000000, // 3 MB
            allowedFileTypesRE: /ejs/,
        }
        let fileUploader = new Uploader(req,fileOptions);
        let uploadResponse = await fileUploader.uploadSingle(req,res,fieldName);
        console.log(uploadResponse);

        if(uploadResponse.status_code!=200){
            return res.json({ success: false });
        }


        let workflow = new Workflow();
        workflow.name = req.body.name;
        workflow.fields = req.body.fields;
        let approvers = req.body.approvers;
        //workflow.path = req.file.fileName;
        workflow.path = uploadResponse.data.file.path;

        console.log('gggg');
        for (let i = 0; i < approvers.length; i++) {
            let grp = await Group.findById(approvers[i].grp).exec();
            if (!grp) {
                console.log('Group doesnt exists');
                return res.json({ success: false });
            }
            else {
                let approver = {};
                approver.level = approvers[i].level;
                approver.grp = grp;
                workflow.approvers.push(approver);
            }
        }
        console.log('aa');
        await workflow.save();
        console.log('Success');
        return res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({ success: false });
    }
}

exports.viewWorkflow = async (req, res) => {
    try {
        let workflow = await Workflow.findById(req.body.workflowId).populate({
            path: 'approvers.grp',
            populate: {
                path: 'members'
            }
        }).exec();
        // const templateEjs = await fs.readFileSync(path.join('../uploads', workflow.path), 'utf8');
        // workflow.templateEjs = templateEjs;
        if (!workflow) {
            return res.json({ success: false });
        }
        else {
            return res.json({ success: true, workflow: workflow });
        }
    } catch (error) {
        console.log(error);
    }
}

exports.editWorkflow = async (req, res) => {
    try {
        let workflow = await Workflow.findById(req.body.workflowId).exec();
        if (!workflow) {
            return res.json({ success: false });
        }
        else {
            workflow.name = req.body.name;
            workflow.fields = req.body.fields;
            approvers = req.body.approvers;

            for (let i = 0; i < approvers.length; i++) {
                let grp = await Group.findById(approvers[i].grp);

                if (!grp) {
                    return res.json({ success: false });
                }
                else {
                    approvers.push(approvers[i]);
                }
            }

            await workflow.save();
            return res.json({ success: true });
        }
    } catch (error) {
        res.json({ success: false });
    }
}
