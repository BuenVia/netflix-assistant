import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

/*
TO DO:

See challenge2.py of vector_embedding project.
- Create an embedding of the 'query' that is in the handleChange function (create_embedding).
- Perform similarity search of the embedding against what is in the vector database (find_nearest_match)
- Generate the text from OpenAI API (get_chat_completion)
*/

function App() {
  const openaiKey = process.env.REACT_APP_OPENAI_API_KEY
  const supabaseKey = process.env.REACT_APP_SUPABASE_API_KEY
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL

  const openai_client = new OpenAI(
    {
      apiKey: openaiKey,
      dangerouslyAllowBrowser: true
    }
  )


  const supabase_client = createClient(supabaseUrl, supabaseKey)
  
  const [showOutput, setShowOutput] = useState(false)
  const [userInput, setUserInput] = useState({
    favourite: "",
    mood: "",
    style: ""
  })
  const [answerText, setAnswerText] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setUserInput(prevVals => {
      return {
        ...prevVals,
        [name]: value
      }
    })
  }

  const handleClick = async () => {    
    const query = {
      role: 'user',
      content: `Favourite: ${userInput.favourite}; Mood: ${userInput.mood}; Style: ${userInput.style}`
    }    
    const embedding = await createEmbedding(query)
    const match = await findNearestMatch(embedding)
    const chat = await getChatCompletion(match, query)
    setAnswerText(chat)

    setShowOutput(prevVal => !prevVal)
  }

  const createEmbedding = async (input) => {
    const embedding = await openai_client.embeddings.create({
      model: "text-embedding-3-small",
      input: input.content,
      encoding_format: "float",
    });
    return embedding.data[0].embedding
  }

  const findNearestMatch = async (embedding) => {
    const { data } = await supabase_client.rpc('match_movies_two', {
      query_embedding: embedding, // Pass the embedding you want to compare
      match_threshold: 0.1, // Choose an appropriate threshold for your data
      match_count: 10, // Choose the number of matches
    })    
    return data[0].content
  }

  const getChatCompletion = async (text, query) => {   
    const messages = [
      {
        'role': "developer", 
        'content': 'You are an enthusiastic movies expert who loves recommending movies to people. You will be given three pieces of information - the user\'s favrourite movie, the mood that they want and what style of movie. Your main job is to formulate a short answer to the question using the provided context. Please do not make up the answer. Always speak as if you were chatting to a friend.'
      },
      {
        role: 'user',
        content: `Favourite: ${userInput.favourite}; Mood: ${userInput.mood}; Style: ${userInput.style}`
      } 
    ]
    
    console.log(messages);
    
    const response = openai_client.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.5,
      frequency_penalty: 0.5
    })
    return (await response).choices[0].message.content
  }
    
  
  return (
    <div>

      <div className="header">
        <img src="../assets/logo.png" alt="NetflixLogo" />
        <h2>Netflix Chooser</h2>
      </div>
      
      <div className="main_body">

        {showOutput ? 
          <div>
            <div className="answer_card">
              <h3>Film Title</h3>  
              <p>{answerText}</p>
              <button onClick={handleClick}>Go Again</button>
            </div>
          </div>
      :
      <div className="questions">
        <div className="field">
          <label htmlFor="" className="question">What's your favourite movie and why?</label>
          <textarea 
            name="favourite" 
            className="userInput" 
            onChange={handleChange} 
            value={userInput.favourite}
          >
          </textarea>
        </div>
        
        <div className="field">
          <label htmlFor="" className="question">Are you in the mood for something new or a classic?</label>
          <textarea name="mood" id="" className="userInput" value={userInput.mood} onChange={handleChange}></textarea>
        </div>
        
        <div className="field">
          <label htmlFor="" className="question">Do you want to have fun or something serious?</label>
          <textarea name="style" id="" className="userInput" value={userInput.style} onChange={handleChange}></textarea>
        </div>
        
        <button onClick={handleClick} className="">Let's Go</button>
        
      </div>
      }
      </div>
      
    </div>
  );
}

export default App;
