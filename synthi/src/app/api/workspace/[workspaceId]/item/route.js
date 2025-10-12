import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';

const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
});

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'my-workspace-content-bucket';


export async function GET(request, { params }) {
    const data = await params;
    const workspaceId = data.workspaceId;
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('filePath');

    try {
        if (!filePath) {
            return NextResponse.json({ error: 'filePath query parameter is required.' }, { status: 400 });
        }
        
        if (filePath.endsWith('/')) {
             return NextResponse.json({ error: 'Cannot GET folder content. Use the listing endpoint for directory contents.' }, { status: 400 });
        }

        const gcsFilePath = `workspaces/${workspaceId}/${filePath}`;

        const file = storage.bucket(BUCKET_NAME).file(gcsFilePath);
        const [exists] = await file.exists();

        if (!exists) {
            return NextResponse.json({ error: `File not found: ${filePath}` }, { status: 404 });
        }

        const [metadata] = await file.getMetadata();

        const fileStream = file.createReadStream();

        const webStream = new ReadableStream({
            start(controller) {
                fileStream.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });
                fileStream.on('end', () => {
                    controller.close();
                });
                fileStream.on('error', (err) => {
                    console.error('Stream error:', err);
                    controller.error(err);
                });
            },
            cancel() {
                fileStream.destroy();
            }
        });

        return new Response(webStream, {
            status: 200,
            headers: {
                'Content-Type': metadata.contentType || 'application/octet-stream',
                'Content-Length': metadata.size,
            },
        });

    } catch (error) {
        const status = error.message.startsWith('Forbidden') ? 403 : (error.message.includes('required') ? 400 : 500);
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error during file retrieval.' }, { status });
    }
}

export async function POST(request, { params }) {
    const data = await params;
    const workspaceId = data.workspaceId;

    try {
        const formData = await request.formData();
        const filePath = formData.get('filePath');
        const fileContent = formData.get('file'); 

        if (!filePath) {
            return NextResponse.json({ error: 'filePath query parameter is required for POST.' }, { status: 400 });
        }

        const gcsFilePath = `workspaces/${workspaceId}/${filePath}`;
        const file = storage.bucket(BUCKET_NAME).file(gcsFilePath);

        if (filePath.endsWith('/')) {
            const [exists] = await file.exists();
            if (exists) {
                return NextResponse.json({ error: `Folder already exists: ${filePath}` }, { status: 409 });
            }

            await file.save('', {
                contentType: 'application/x-directory',
                resumable: false,
                metadata: {
                    cacheControl: 'no-cache',
                    metadata: {
                        isFolder: 'true',
                        name: filePath.split('/').filter(Boolean).slice(-1)[0] + "/",
                        path: filePath,
                        createdBy: 'synthi-ide',
                        isMarker: 'true'
                    }
                }
            });

            return NextResponse.json({ 
                message: `Folder created successfully: ${filePath}`, 
                path: filePath 
            }, { status: 201 });

        } else {
            const contentType = request.headers.get('content-type') || 'application/octet-stream';
            
            const writeStream = file.createWriteStream({
                metadata: {
                    contentType: contentType,
                    metadata: {
                        originalName: file.name,
                    }
                },
                resumable: false,
            });

            const readableStream = fileContent.stream();

            await new Promise((resolve, reject) => {
                readableStream.pipeTo(new WritableStream({
                    write(chunk) {
                        writeStream.write(chunk);
                    },
                    close() {
                        writeStream.end(resolve);
                    },
                    abort(reason) {
                        writeStream.destroy(reason);
                        reject(reason);
                    }
                })).catch(reject); 

                writeStream.on('error', reject);
                writeStream.on('finish', resolve);
            });

            return NextResponse.json({ 
                message: `File uploaded successfully to: ${filePath}`, 
                path: filePath 
            }, { status: 201 });
        }

    } catch (error) {
        const status = error.message.startsWith('Forbidden') ? 403 : (error.message.includes('required') ? 400 : 500);
        console.error('GCS POST Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error during file creation.' }, { status });
    }
}

export async function PUT(request, { params }) {
    const data = await params;
    const workspaceId = data.workspaceId;
    const filePath = request.body.get('filePath');
    const newPath = request.body.get('newPath');

    try {

        if (!filePath) {
            return NextResponse.json({ error: 'filePath query parameter is required for PUT.' }, { status: 400 });
        }
        
        if (newPath) {
            
            if (filePath.endsWith('/') !== newPath.endsWith('/')) {
                return NextResponse.json({ error: 'Cannot change item type during rename (e.g., folder to file or vice versa).' }, { status: 400 });
            }

            const isFolder = filePath.endsWith('/');
            const oldGcsPath = `workspaces/${workspaceId}/${filePath}`;
            const newGcsPath = `workspaces/${workspaceId}/${newPath}`;

            if (isFolder) {
                
                const [files] = await storage.bucket(BUCKET_NAME).getFiles({
                    prefix: oldGcsPath,
                    autoPaginate: true, 
                });

                if (files.length === 0) {
                    const [exists] = await storage.bucket(BUCKET_NAME).file(oldGcsPath).exists();
                    if (!exists) {
                        return NextResponse.json({ error: `Folder not found: ${filePath}` }, { status: 404 });
                    }
                }

                const movePromises = files.map(file => {
                    const destinationPath = file.name.replace(oldGcsPath, newGcsPath);
                    return file.move(destinationPath);
                });

                await Promise.all(movePromises);

                return NextResponse.json({ 
                    message: `Folder successfully renamed from ${filePath} to ${newPath}.`,
                    oldPath: filePath,
                    newPath: newPath
                }, { status: 200 });

            } else {
                const file = storage.bucket(BUCKET_NAME).file(oldGcsPath);
                const [exists] = await file.exists();

                if (!exists) {
                    return NextResponse.json({ error: `File not found: ${filePath}` }, { status: 404 });
                }

                await file.move(newGcsPath);

                return NextResponse.json({ 
                    message: `File successfully renamed from ${filePath} to ${newPath}.`,
                    oldPath: filePath,
                    newPath: newPath
                }, { status: 200 });
            }

        } else {
            if (filePath.endsWith('/')) {
                 return NextResponse.json({ error: 'Cannot PUT folder content. PUT is only for file content updates.' }, { status: 400 });
            }

            const gcsFilePath = `workspaces/${workspaceId}/${filePath}`;
            const file = storage.bucket(BUCKET_NAME).file(gcsFilePath);
            
            const contentType = request.headers.get('content-type') || 'application/octet-stream';
            
            const writeStream = file.createWriteStream({
                metadata: {
                    contentType: contentType,
                },
                resumable: false,
            });

            await new Promise((resolve, reject) => {
                request.body.pipeTo(new WritableStream({
                    write(chunk) {
                        writeStream.write(chunk);
                    },
                    close() {
                        writeStream.end(resolve);
                    },
                    abort(reason) {
                        writeStream.destroy(reason);
                        reject(reason);
                    }
                })).catch(reject);

                writeStream.on('error', reject);
                writeStream.on('finish', resolve);
            });

            return NextResponse.json({ 
                message: `File updated successfully at: ${filePath}`, 
                path: filePath 
            }, { status: 200 }); 
        }

    } catch (error) {
        const status = error.message.startsWith('Forbidden') ? 403 : (error.message.includes('required') ? 400 : 500);
        console.error('GCS PUT Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error during update or rename.' }, { status });
    }
}


export async function DELETE(request, { params }) {
    const data = await params;
    const workspaceId = data.workspaceId;
    const filePath = request.body.get('filePath');

    try {

        if (!filePath) {
            return NextResponse.json({ error: 'filePath query parameter is required for DELETE.' }, { status: 400 });
        }

        const gcsFilePath = `workspaces/${workspaceId}/${filePath}`;
        const file = storage.bucket(BUCKET_NAME).file(gcsFilePath);

        if (filePath.endsWith('/')) {
            const [files] = await storage.bucket(BUCKET_NAME).deleteFiles({
                prefix: gcsFilePath,
            });

            if (files && files.length > 0) {
                 return NextResponse.json({ 
                    message: `Folder and ${files.length} contained items deleted successfully at: ${filePath}`, 
                    path: filePath 
                }, { status: 200 });
            } else {
                 return NextResponse.json({ error: `Folder not found or already empty: ${filePath}` }, { status: 404 });
            }

        } else {
            const [exists] = await file.exists();
            if (!exists) {
                 return NextResponse.json({ error: `File not found: ${filePath}` }, { status: 404 });
            }
            
            await file.delete();

            return NextResponse.json({ 
                message: `File deleted successfully: ${filePath}`, 
                path: filePath 
            }, { status: 200 }); 
        }

    } catch (error) {
        const status = error.message.startsWith('Forbidden') ? 403 : (error.message.includes('required') ? 400 : 500);
        console.error('GCS DELETE Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error during file deletion.' }, { status });
    }
}
