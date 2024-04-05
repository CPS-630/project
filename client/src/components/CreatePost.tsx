import React, { useState, useEffect, type ChangeEvent } from 'react'
import '../style/CreatePost.css'
import { useAuth0 } from '@auth0/auth0-react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faChevronRight, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { API_DOMAIN, useApi } from '../context/APIContext'

const CreatePost = (): React.ReactElement => {
  const { getAccessTokenSilently } = useAuth0()
  const [images, setImages] = useState<File[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [displayImages, setDisplays] = useState<Record<number, string>>({})
  const [imageError, setImageError] = useState<string>('')
  const navigate = useNavigate()
  const { sendRequest } = useApi()

  useEffect(() => {
    setDisplays({})
    const newImages: Record<number, string> = {}
    const totalImages = images.length
    let imagesProcessed = 0
    for (let i: number = 0; i < images.length; i++) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result != null && typeof e.target.result === 'string') {
          newImages[i] = e.target.result.toString()
          imagesProcessed++
          if (imagesProcessed === totalImages) {
            setDisplays(newImages)
          }
        }
      }
      reader.readAsDataURL(images[i])
    }
  }, [images])

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    setImageError('')
    const files = event.target.files
    if (files != null) {
      const filesArray = Array.from(files)
      const maxSize = 10 * 1024 * 1024

      if (filesArray.length + images.length > 4) {
        setImageError('Cannot upload more than 4 images.')
        if (event.target != null) {
          (event.target as HTMLInputElement).value = ''
        }
        return
      }

      filesArray.forEach((file: File) => {
        if (maxSize > file.size) {
          const reader = new FileReader()
          let fileURL: string = ''
          reader.onload = (e) => {
            if (e.target?.result != null && typeof e.target.result === 'string') {
              fileURL = e.target.result.toString()

              if (!Object.values(displayImages).includes(fileURL)) {
                setImages((images) => [...images, file])
              } else {
                setImageError('No duplicate files')
              }
            }
          }
          reader.readAsDataURL(file)
        } else {
          setImageError('File can be a maximum of 10mb')
        }
      })

      if (event.target !== undefined) {
        (event.target as HTMLInputElement).value = ''
      }
    }
  }

  const handleImageDelete = (event: React.MouseEvent<HTMLButtonElement>, index: number): void => {
    event.preventDefault()
    const updatedImages = [...images]
    updatedImages.splice(index, 1)
    setImages(updatedImages)
  }

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    const form = e.target as HTMLFormElement

    const formData = {
      title: form.adTitle.value,
      adType: form.adType.value,
      description: form.description.value,
      location: form.location.value,
      categories,
      price: parseFloat(form.price.value as string)
    }

    const { status, response, error } = await sendRequest<{
      postId: number
    }>({
      method: 'POST',
      endpoint: 'post/',
      body: formData
    })

    if (status !== 201) {
      console.log(`Could not create post: ${error}`)
      return
    }

    void uploadImages(response.postId.toString())
  }

  const uploadImages = async (postID: string): Promise<void> => {
    let token: string
    try {
      token = await getAccessTokenSilently()
    } catch (e) {
      return
    }

    const formData = new FormData()
    images.forEach(image => {
      formData.append('post-images', image)
    })

    void fetch(`${API_DOMAIN}post/image/upload/${postID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    }).then(async response => {
      if (!response.ok) {
        console.error('Images could not be uploaded')
      } else {
        navigate(`/listing/${postID}`)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const selected = e.target.value
    setCategories(categories => {
      if (!categories.includes(selected)) {
        return [...categories, selected]
      }
      return categories
    })
  }

  return (
        <div className='create-post'>
          <div className='create-post-container'>
            <p id='breadcrumbs'> <Link id='back-to' to='/'>Home</Link> <FontAwesomeIcon icon={faChevronRight} /> Post Ad</p>
            <h2>Post An Ad</h2>
            <form id="adForm" onSubmit={(event) => { void handleCreatePost(event) }}>
                <label htmlFor="adTitle">Title:</label>
                <input type="text" id="adTitle" name="adTitle" required maxLength={200} onKeyDown={handleKeyDown}/>
                <br/>

                <label htmlFor="imageUpload" className="uploadLabel">Upload Images (4 Maximum):</label>
                <div id="imageUpload">
                        <div id="arrowWrapper">
                            <div id="uploadArrow"><FontAwesomeIcon icon={faUpload}/></div>
                        </div>
                    <input type="file" id="adImages" name="adImages" multiple onChange={handleImageUpload}
                        accept="image/jpeg, image/jpg, image/png"/>
                </div>
                {(imageError !== '') && <div id="imageError">{imageError}</div>}
                <div id="imagePreview">

                  {Object.entries(displayImages).map(([key, value]) => (
                      <div key={key} className="uploadedImages">
                          <img key={key} src={value} />
                          <button onClick={(event) => { handleImageDelete(event, Number(key)) }}><FontAwesomeIcon icon={faTrashCan}/></button>
                      </div>
                  ))}

                </div>
                <br/>

                <label htmlFor="adType">Ad Type:</label>
                <select id="adType" name="adType" required>
                    <option value="S">Selling</option>
                    <option value="W">Wanted</option>
                    <option value="A">Academic Service</option>
                </select>
                <br/>

                <label htmlFor="description">Description:</label>
                <textarea id="description" name="description" required></textarea>
                <br/>

                <label htmlFor="location">Location:</label>
                <input type="text" id="location" name="location" required onKeyDown={handleKeyDown}/>
                <br/>

                <label htmlFor="categories">Categories:</label>
                <select id="categories" name="categories" required onChange={handleSelectChange}>
                  <option selected disabled hidden>Choose a category</option>
                  <option>Housing</option>
                  <option>Books</option>
                  <option>Electronics</option>
                  <option>Jobs</option>
                  <option>Services</option>
                  <option>Events</option>
                  <option>Other</option>
                </select>
                <div id="selectedCategories">
                    {categories.map((category, index) => (
                        <div key={index} className="selectedCategory">
                            <p>{category}</p>
                            <FontAwesomeIcon icon={faTrashCan} onClick={() => { setCategories(categories.filter((_, i) => i !== index)) }}/>
                        </div>
                    ))}
                </div>
                <br/>

                <label htmlFor="price">Price:</label>
                <input type="number" id="price" name="price" required min="0" step="0.01" onKeyDown={handleKeyDown}/>
                <br/>

                <button type="submit">Submit</button>
            </form>
        </div>
      </div>
  )
}

export default CreatePost
